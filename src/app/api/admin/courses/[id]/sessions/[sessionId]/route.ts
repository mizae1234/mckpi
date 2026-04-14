import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const body = await request.json()
    const { sessionDate, sessionEndDate, registrationEndDate, location, capacity, waitlistCapacity, trainerName, meetingUrl } = body

    const session = await prisma.offlineSession.update({
      where: { id: sessionId },
      data: {
        ...(sessionDate !== undefined && { sessionDate: new Date(sessionDate) }),
        ...(sessionEndDate !== undefined && { sessionEndDate: sessionEndDate ? new Date(sessionEndDate) : null }),
        ...(registrationEndDate !== undefined && { registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : null }),
        ...(location !== undefined && { location }),
        ...(capacity !== undefined && { capacity: parseInt(capacity) }),
        ...(waitlistCapacity !== undefined && { waitlistCapacity: parseInt(waitlistCapacity) }),
        ...(trainerName !== undefined && { trainerName }),
        ...(meetingUrl !== undefined && { meetingUrl }),
      },
      include: { _count: { select: { registrations: true } } }
    })

    return NextResponse.json(session)
  } catch (error: any) {
    console.error('[API] Update session error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  try {
    const { sessionId } = await params
    await prisma.offlineSession.delete({ where: { id: sessionId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Delete session error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
