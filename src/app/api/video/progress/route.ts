import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const video = await prisma.video.findFirst({ where: { is_active: true } })
  if (!video) {
    return NextResponse.json({})
  }

  const progress = await prisma.videoProgress.findUnique({
    where: {
      driver_id_video_id: {
        driver_id: session.user.id,
        video_id: video.id,
      },
    },
  })

  return NextResponse.json(progress || { max_watched_time: 0, total_duration: 0, completed: false, last_position: 0 })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { max_watched_time, total_duration, completed, last_position } = body

  const video = await prisma.video.findFirst({ where: { is_active: true } })
  if (!video) {
    return NextResponse.json({ error: 'No active video' }, { status: 404 })
  }

  const progress = await prisma.videoProgress.upsert({
    where: {
      driver_id_video_id: {
        driver_id: session.user.id,
        video_id: video.id,
      },
    },
    update: {
      max_watched_time: Math.max(max_watched_time, 0),
      total_duration,
      completed,
      last_position,
    },
    create: {
      driver_id: session.user.id,
      video_id: video.id,
      max_watched_time,
      total_duration,
      completed,
      last_position,
    },
  })

  // Update onboarding status
  if (completed) {
    await prisma.driver.update({
      where: { id: session.user.id },
      data: { onboarding_status: 'WATCHING' },
    })
  }

  return NextResponse.json(progress)
}
