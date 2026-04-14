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

    // 4. Also fetch any courses the user has a TrainingResult for (manual enrollments)
    const trainingResults = await prisma.trainingResult.findMany({
      where: { employeeId: session.user.id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            trainingType: true,
            isMandatory: true,
          }
        }
      }
    })

    const trStatusMap = new Map(trainingResults.map(tr => [tr.courseId, tr.status]))
    
    // Add missing courses from TrainingResult
    const autoEnrolledCourses = trainingResults
      .filter(tr => !existingCourseIds.has(tr.courseId))
      .map(tr => ({
        id: `manual-${tr.courseId}`,
        employeeId: session.user.id,
        courseId: tr.courseId,
        assignedBy: 'SELF_OR_ADMIN',
        assignedAt: tr.createdAt.toISOString(),
        dueDate: null,
        status: tr.status,
        course: tr.course
      }))

    // 5. Fetch any OfflineRegistrations (Classroom reservations)
    const offlineRegs = await prisma.offlineRegistration.findMany({
      where: { employeeId: session.user.id },
      include: {
        session: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                trainingType: true,
                isMandatory: true,
              }
            }
          }
        }
      }
    })

    const offlineCourses = offlineRegs
      .filter(reg => !existingCourseIds.has(reg.session.courseId) && !trainingResults.find(t => t.courseId === reg.session.courseId))
      .map(reg => ({
        id: `offline-${reg.id}`,
        employeeId: session.user.id,
        courseId: reg.session.courseId,
        assignedBy: 'SELF',
        assignedAt: reg.registeredAt.toISOString(),
        dueDate: reg.session.startDate.toISOString(), // Use session start date as due date cue
        status: reg.status === 'CANCELLED' ? 'CANCELLED' : 'NOT_STARTED', // Just a visual proxy
        course: reg.session.course
      }))

    const allAssignments = [...assignments, ...virtualAssignments, ...autoEnrolledCourses, ...offlineCourses].map(a => ({
      ...a,
      status: trStatusMap.get(a.courseId) || a.status
    }))

    return NextResponse.json(allAssignments)
  } catch (error) {
    console.error('[API] Failed to fetch assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
