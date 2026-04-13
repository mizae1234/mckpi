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
    const { step_id, watch_percent, course_id } = body

    if (!step_id || watch_percent === undefined || !course_id) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const step = await prisma.courseStep.findUnique({ where: { id: step_id } })
    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })

    const isCompleted = watch_percent >= step.min_watch_percent

    // Update or create progress
    const progress = await prisma.stepProgress.upsert({
      where: { employee_id_step_id: { employee_id: employeeId, step_id } },
      update: {
        watch_percent,
        completed: isCompleted ? true : undefined, // only update to true, never revert
      },
      create: {
        employee_id: employeeId,
        step_id,
        watch_percent,
        completed: isCompleted,
      },
    })

    // If reached completion, trigger evaluation
    if (isCompleted) {
      await evaluateCourseCompletion(employeeId, course_id)
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error('[API] Progress update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}) as any
