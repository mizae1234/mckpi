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

    const existingReg = await prisma.offlineRegistration.findFirst({
      where: {
        employeeId,
        sessionId,
        status: { in: ['REGISTERED', 'WAITLISTED'] }
      },
      include: {
        session: true
      }
    })

    if (!existingReg) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการลงทะเบียนที่สามารถยกเลิกได้' }, { status: 400 })
    }

    // Check if the cancellation is allowed (before session date or registration deadline)
    const now = new Date()
    const sessionDate = new Date(existingReg.session.sessionDate)
    const regDeadline = existingReg.session.registrationEndDate ? new Date(existingReg.session.registrationEndDate) : sessionDate

    if (now > regDeadline) {
      return NextResponse.json({ error: 'ไม่สามารถยกเลิกได้เนื่องจากหมดเขตการลงทะเบียน/ยกเลิกแล้ว' }, { status: 400 })
    }

    // Wrap in Transaction to update statuses
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Registration to CANCELLED instead of deleting
      const canceled = await tx.offlineRegistration.update({
        where: { id: existingReg.id },
        data: { status: 'CANCELLED' }
      })

      // 2. We should also check if they have ANY other active sessions for this course. 
      // If none, we should probably mark the TrainingResult as something else or just leave it IN_PROGRESS?
      // For now, let's leave TrainingResult as is. The user can register again later.
      // Wait, if they completely cancel out of the course, maybe we delete their TrainingResult if they haven't started any steps?

      // Note: We leave the TrainingResult intact.

      return canceled
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    console.error('[API] Cancel Classroom Session error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
