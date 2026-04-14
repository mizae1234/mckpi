import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await params
    const body = await request.json()
    const { sessionDate, sessionEndDate, registrationEndDate, location, capacity, waitlistCapacity, trainerName, meetingUrl } = body

    if (!sessionDate) {
      return NextResponse.json({ error: 'กรุณาระบุวันที่อบรม' }, { status: 400 })
    }

    const session = await prisma.offlineSession.create({
      data: {
        courseId,
        sessionDate: new Date(sessionDate),
        sessionEndDate: sessionEndDate ? new Date(sessionEndDate) : null,
        registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : null,
        location: location || '',
        capacity: capacity ? parseInt(capacity) : 30,
        waitlistCapacity: waitlistCapacity ? parseInt(waitlistCapacity) : 0,
        trainerName: trainerName || '',
        meetingUrl: meetingUrl || null,
      },
      include: { _count: { select: { registrations: true } } }
    })

    return NextResponse.json(session)
  } catch (error: any) {
    console.error('[API] Create session error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
