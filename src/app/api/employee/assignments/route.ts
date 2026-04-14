import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
// Force refresh type cache

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let assignments = await prisma.courseAssignment.findMany({
      where: { employeeId: session.user.id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            trainingType: true,
            isMandatory: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
    })

    // --- Dynamic Union of Mandatory Courses ---
    const existingCourseIds = new Set(assignments.map(a => a.course.id))

    const mandatoryCourses = await prisma.course.findMany({
      where: {
        isMandatory: true,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        code: true,
        title: true,
        trainingType: true,
        isMandatory: true,
      }
    })

    const missingMandatoryCourses = mandatoryCourses.filter(c => !existingCourseIds.has(c.id))

    // Create virtual assignments for missing mandatory courses
    const virtualAssignments = missingMandatoryCourses.map(course => ({
      id: `virtual-${course.id}`, // Mock ID so frontend React keys don't break
      employeeId: session.user.id,
      courseId: course.id,
      assignedBy: 'SYSTEM',
      assignedAt: new Date().toISOString(),
      dueDate: null,
      status: 'NOT_STARTED',
      course: course
    }))

    // Combine them and Sync Status from TrainingResult (Actual History)
    const trainingResults = await prisma.trainingResult.findMany({
      where: { employeeId: session.user.id }
    })
    const trStatusMap = new Map(trainingResults.map(tr => [tr.courseId, tr.status]))

    const allAssignments = [...assignments, ...virtualAssignments].map(a => ({
      ...a,
      status: trStatusMap.get(a.courseId) || a.status
    }))

    return NextResponse.json(allAssignments)
  } catch (error) {
    console.error('[API] Failed to fetch assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
