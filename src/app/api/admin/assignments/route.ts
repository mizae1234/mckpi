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
    const { employee_id, course_id, due_date } = body

    if (!employee_id || !course_id) {
      return NextResponse.json({ error: 'กรุณาเลือกพนักงานและคอร์ส' }, { status: 400 })
    }

    // Check duplicate
    const existing = await prisma.courseAssignment.findUnique({
      where: { employee_id_course_id: { employee_id, course_id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'พนักงานนี้ถูกมอบหมายคอร์สนี้แล้ว' }, { status: 400 })
    }

    const assignment = await prisma.courseAssignment.create({
      data: {
        employee_id,
        course_id,
        assigned_by: session.user.id,
        due_date: due_date ? new Date(due_date) : null,
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
        employee: { select: { id: true, employee_code: true, full_name: true, department: true } },
        course: { select: { id: true, code: true, title: true, training_type: true } },
      },
      orderBy: { assigned_at: 'desc' },
    })
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('[API] List assignments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
