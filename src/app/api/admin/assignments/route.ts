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
    const { employeeIds, courseIds, dueDate } = body

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0 ||
        !courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: 'กรุณาเลือกพนักงานและคอร์สอย่างน้อย 1 รายการ' }, { status: 400 })
    }

    const data = []
    for (const empId of employeeIds) {
      for (const cId of courseIds) {
        data.push({
          employeeId: empId,
          courseId: cId,
          assignedBy: session.user.id,
          dueDate: dueDate ? new Date(dueDate) : null,
        })
      }
    }

    await prisma.courseAssignment.createMany({
      data,
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, count: data.length }, { status: 201 })
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
