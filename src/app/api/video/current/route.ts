import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const video = await prisma.video.findFirst({
    where: { is_active: true },
    select: { id: true, title: true, url: true, required_watch_percentage: true },
  })

  if (!video) {
    return NextResponse.json({ error: 'No active video' }, { status: 404 })
  }

  return NextResponse.json(video)
}
