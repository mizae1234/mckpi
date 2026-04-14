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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')
    const depsParam = searchParams.get('departments')

    if (depsParam) {
      const deps = depsParam.split(',').map(d => d.trim()).filter(Boolean)
      if (deps.length > 0) {
        const employees = await prisma.employee.findMany({
          where: { departmentCode: { in: deps } },
          orderBy: { employeeCode: 'asc' }
        })
        return NextResponse.json(employees)
      }
    }

    // ถ้าไม่มีคำค้นหา ส่งคืนอาร์เรย์ว่างเปล่าเพื่อหลีกเลี่ยงการโหลดแบบหว่านแห 3000 คน
    if (!q || q.trim() === '') {
      return NextResponse.json([])
    }

    const keyword = q.trim()
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { employeeCode: { contains: keyword, mode: 'insensitive' } },
          { fullName: { contains: keyword, mode: 'insensitive' } },
          { departmentCode: { contains: keyword, mode: 'insensitive' } },
          { branchCode: { contains: keyword, mode: 'insensitive' } },
          { positionCode: { contains: keyword, mode: 'insensitive' } },
        ]
      },
      orderBy: { employeeCode: 'asc' },
      take: 100 // Limit results for sanity
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.error('[API] List employees error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
