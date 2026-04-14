import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Admin manually adds a trainee to a course
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: courseId } = await params
    const { employeeId, sessionId, status } = await request.json()

    if (!employeeId) {
      return NextResponse.json({ error: 'กรุณาเลือกพนักงาน' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'ไม่พบหลักสูตร' }, { status: 404 })

    if (course.trainingType === 'OFFLINE') {
      // Classroom: Add to a specific session as OfflineRegistration
      if (!sessionId) {
        return NextResponse.json({ error: 'กรุณาเลือกรอบอบรม' }, { status: 400 })
      }

      // Check if already registered
      const existing = await prisma.offlineRegistration.findFirst({
        where: { employeeId, sessionId, status: { not: 'CANCELLED' } }
      })
      if (existing) {
        return NextResponse.json({ error: 'พนักงานลงทะเบียนรอบนี้แล้ว' }, { status: 400 })
      }

      const registration = await prisma.offlineRegistration.create({
        data: {
          employeeId,
          sessionId,
          status: status || 'REGISTERED',
        },
        include: {
          employee: {
            select: { id: true, employeeCode: true, fullName: true, branchCode: true, departmentCode: true }
          }
        }
      })

      // Ensure TrainingResult exists
      await prisma.trainingResult.upsert({
        where: { employeeId_courseId_source: { employeeId, courseId, source: 'OFFLINE' } },
        update: {},
        create: { employeeId, courseId, source: 'OFFLINE', status: 'IN_PROGRESS' }
      })

      return NextResponse.json(registration, { status: 201 })

    } else {
      // Online/External: Create TrainingResult directly
      const existing = await prisma.trainingResult.findFirst({
        where: { employeeId, courseId }
      })
      if (existing) {
        return NextResponse.json({ error: 'พนักงานลงทะเบียนหลักสูตรนี้แล้ว' }, { status: 400 })
      }

      const result = await prisma.trainingResult.create({
        data: {
          employeeId,
          courseId,
          source: course.trainingType === 'EXTERNAL' ? 'EXTERNAL' : 'ONLINE',
          status: status || 'IN_PROGRESS',
        },
        include: {
          employee: {
            select: { id: true, employeeCode: true, fullName: true, branchCode: true, departmentCode: true }
          }
        }
      })

      return NextResponse.json(result, { status: 201 })
    }
  } catch (error: any) {
    console.error('[API] Admin add trainee error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
