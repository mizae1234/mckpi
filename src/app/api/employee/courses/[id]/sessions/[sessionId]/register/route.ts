import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, sessionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id: courseId, sessionId } = await params
    const employeeId = session.user.id

    // Check if the user is already registered for ANY session of this course
    const existingCourseReg = await prisma.offlineRegistration.findFirst({
      where: {
        employeeId,
        session: { courseId },
        status: { in: ['REGISTERED', 'ATTENDED', 'WAITLISTED'] }
      }
    })

    if (existingCourseReg) {
      return NextResponse.json({ error: 'คุณลงทะเบียนรอบอื่นของหลักสูตรนี้ไปแล้ว' }, { status: 400 })
    }

    // Wrap in transaction to prevent race conditions on capacity
    const result = await prisma.$transaction(async (tx) => {
      const targetSession = await tx.offlineSession.findUnique({
        where: { id: sessionId },
        include: { _count: { select: { registrations: { where: { status: { not: 'CANCELLED' } } } } } }
      })

      if (!targetSession) throw new Error('ไม่พบรอบอบรมนี้')

      const currentRegCount = targetSession._count.registrations

      if (currentRegCount >= targetSession.capacity) {
        throw new Error('ขออภัย ที่นั่งของรอบเวลานี้เต็มแล้ว')
      }

      // Create Offline Registration
      const newReg = await tx.offlineRegistration.create({
        data: {
          employeeId,
          sessionId,
          status: 'REGISTERED'
        }
      })

      // Ensure they have a TrainingResult so it shows as "IN_PROGRESS" on their dashboard
      const existingResult = await tx.trainingResult.findFirst({
        where: { employeeId, courseId }
      })

      if (!existingResult) {
        await tx.trainingResult.create({
          data: {
            employeeId,
            courseId,
            source: 'OFFLINE',
            status: 'IN_PROGRESS'
          }
        })
      }

      return newReg
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    console.error('[API] Register Classroom Session error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
