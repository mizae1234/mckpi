import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { employeeId, courseId, dueDate } = body

    if (!employeeId || !courseId) {
      return NextResponse.json({ error: 'กรุณาเลือกพนักงานและคอร์ส' }, { status: 400 })
    }

    // Check duplicate
    const existing = await prisma.courseAssignment.findUnique({
      where: { employeeId_courseId: { employeeId, courseId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'พนักงานนี้ถูกมอบหมายคอร์สนี้แล้ว' }, { status: 400 })
    }

    const assignment = await prisma.courseAssignment.create({
      data: {
        employeeId,
        courseId,
        assignedBy: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('[API] Create assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const assignments = await prisma.courseAssignment.findMany({
      include: {
        employee: { select: { id: true, employeeCode: true, fullName: true, departmentCode: true } },
        course: { select: { id: true, code: true, title: true, trainingType: true } },
      },
      orderBy: { assignedAt: 'desc' },
    })
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('[API] List assignments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
