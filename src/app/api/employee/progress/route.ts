import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authMiddleware } from '@/lib/auth-edge'
import { evaluateCourseCompletion } from '@/lib/course-eval'

export const POST = authMiddleware(async (request: NextRequest) => {
  try {
    const session = await (request as any).auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employeeId = session.user.id
    const body = await request.json()
    const { stepId, watchPercent, courseId } = body

    if (!stepId || watchPercent === undefined || !courseId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const step = await prisma.courseStep.findUnique({ where: { id: stepId } })
    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })

    const isCompleted = watchPercent >= step.minWatchPercent

    // Update or create progress
    const progress = await prisma.stepProgress.upsert({
      where: { employeeId_stepId: { employeeId: employeeId, stepId } },
      update: {
        watchPercent,
        completed: isCompleted ? true : undefined, // only update to true, never revert
      },
      create: {
        employeeId: employeeId,
        stepId,
        watchPercent,
        completed: isCompleted,
      },
    })

    // If reached completion, trigger evaluation
    if (isCompleted) {
      await evaluateCourseCompletion(employeeId, courseId)
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error('[API] Progress update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}) as any
