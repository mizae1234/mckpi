import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employee_code, full_name, position, department, branch, date_of_birth, start_date } = body

    if (!employee_code || !full_name || !date_of_birth) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 })
    }

    // Check duplicate
    const existing = await prisma.employee.findUnique({
      where: { employee_code: employee_code.toUpperCase() },
    })
    if (existing) {
      return NextResponse.json({ error: 'รหัสพนักงานนี้มีอยู่แล้ว' }, { status: 400 })
    }

    // Generate default password from DOB (ddmmyyyy)
    const dob = new Date(date_of_birth)
    const dd = String(dob.getDate()).padStart(2, '0')
    const mm = String(dob.getMonth() + 1).padStart(2, '0')
    const yyyy = String(dob.getFullYear())
    const defaultPassword = `${dd}${mm}${yyyy}`
    const passwordHash = await bcrypt.hash(defaultPassword, 10)

    const employee = await prisma.employee.create({
      data: {
        employee_code: employee_code.toUpperCase(),
        full_name,
        password_hash: passwordHash,
        position: position || '',
        department: department || '',
        branch: branch || '',
        date_of_birth: dob,
        start_date: start_date ? new Date(start_date) : new Date(),
      },
    })

    // Auto-assign mandatory courses
    const mandatoryCourses = await prisma.course.findMany({
      where: { is_mandatory: true, status: 'PUBLISHED' }
    })

    if (mandatoryCourses.length > 0) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
      const dueDate = new Date(employee.start_date.getTime() + thirtyDaysMs)

      await prisma.courseAssignment.createMany({
        data: mandatoryCourses.map(c => ({
          employee_id: employee.id,
          course_id: c.id,
          due_date: dueDate,
        }))
      })
    }

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('[API] Create employee error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { employee_code: 'asc' },
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.error('[API] List employees error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
