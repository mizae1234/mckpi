import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeCode, fullName, position, department, branchCode, dateOfBirth, startDate } = body

    if (!employeeCode || !fullName || !dateOfBirth) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 })
    }

    // Check duplicate
    const existing = await prisma.employee.findUnique({
      where: { employeeCode: employeeCode.toUpperCase() },
    })
    if (existing) {
      return NextResponse.json({ error: 'รหัสพนักงานนี้มีอยู่แล้ว' }, { status: 400 })
    }

    // Generate default password from DOB (ddmmyyyy)
    const dob = new Date(dateOfBirth)
    const dd = String(dob.getDate()).padStart(2, '0')
    const mm = String(dob.getMonth() + 1).padStart(2, '0')
    const yyyy = String(dob.getFullYear())
    const defaultPassword = `${dd}${mm}${yyyy}`
    const passwordHash = await bcrypt.hash(defaultPassword, 10)

    const employee = await prisma.employee.create({
      data: {
        employeeCode: employeeCode.toUpperCase(),
        fullName,
        passwordHash: passwordHash,
        positionCode: position || '',
        departmentCode: department || '',
        branchCode: branchCode || null,
        dateOfBirth: dob,
        startDate: startDate ? new Date(startDate) : new Date(),
      },
    })

    // Auto-assign mandatory courses
    const mandatoryCourses = await prisma.course.findMany({
      where: { isMandatory: true, status: 'PUBLISHED' }
    })

    if (mandatoryCourses.length > 0) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
      const dueDate = new Date(employee.startDate.getTime() + thirtyDaysMs)

      await prisma.courseAssignment.createMany({
        data: mandatoryCourses.map(c => ({
          employeeId: employee.id,
          courseId: c.id,
          dueDate: dueDate,
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
      orderBy: { employeeCode: 'asc' },
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.error('[API] List employees error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
