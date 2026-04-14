import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employeeId = session.user.id

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true }
    })

    if (!course || course.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Course not available' }, { status: 404 })
    }

    // 1. Create or ensure TrainingResult exists
    const trainingResult = await prisma.trainingResult.upsert({
      where: { employeeId_courseId_source: { employeeId, courseId, source: 'ONLINE' } },
      update: {}, // if exists, do nothing or update status to IN_PROGRESS if needed
      create: {
        employeeId,
        courseId,
        source: 'ONLINE',
        status: 'IN_PROGRESS'
      }
    })

    // 2. Add CourseAssignment so it appears in "แดชบอร์ด"
    await prisma.courseAssignment.upsert({
      where: { employeeId_courseId: { employeeId, courseId } },
      update: {}, // if already assigned, leave it
      create: {
        employeeId,
        courseId,
        status: 'IN_PROGRESS'
      }
    })

    return NextResponse.json({ success: true, trainingResult })

  } catch (error: any) {
    console.error('[API] Register course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
