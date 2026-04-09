import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const video = await prisma.video.findFirst({ where: { is_active: true } })
  return NextResponse.json(video || {})
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { title, url, required_watch_percentage } = body

  const video = await prisma.video.findFirst({ where: { is_active: true } })

  if (video) {
    const updated = await prisma.video.update({
      where: { id: video.id },
      data: {
        ...(title && { title }),
        ...(url && { url }),
        ...(required_watch_percentage && { required_watch_percentage }),
      },
    })
    return NextResponse.json(updated)
  } else {
    const created = await prisma.video.create({
      data: {
        title: title || 'Training Video',
        url: url || '',
        required_watch_percentage: required_watch_percentage || 95,
      },
    })
    return NextResponse.json(created, { status: 201 })
  }
}
