import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const q = searchParams.get('q') // For searching employees

    // หากมีการค้นหาพนักงานเพื่อทำ dropdown
    if (q) {
      const employees = await prisma.employee.findMany({
        where: {
          OR: [
            { employeeCode: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
            { branchCode: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 20,
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          branchCode: true,
          positionCode: true
        }
      })
      return NextResponse.json({ employees })
    }

    // หากระบุ employeeId เพื่อดู Transcript
    if (employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          results: {
            include: {
              course: {
                select: {
                  code: true,
                  title: true,
                  trainingType: true,
                  creditHours: true,
                  isMandatory: true
                }
              }
            },
            orderBy: {
              completedAt: 'desc'
            }
          }
        }
      })

      if (!employee) {
        return NextResponse.json({ error: 'ไม่พบข้อมูลพนักงาน' }, { status: 404 })
      }

      // คำนวณชั่วโมงอบรมรวม (นับเฉพาะวิชาที่ผ่าน)
      let totalCreditHours = 0
      employee.results.forEach(result => {
        if (result.status === 'PASSED') {
          totalCreditHours += (result.course.creditHours || 0)
        }
      })

      return NextResponse.json({ 
        employee, 
        totalCreditHours 
      })
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

  } catch (error: any) {
    console.error('Transcript API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
