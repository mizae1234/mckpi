import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const body = await request.json()
    const { step_type, title, content_url, order_index, is_required, min_watch_percent } = body

    if (!step_type || !title) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 })
    }

    const step = await prisma.courseStep.create({
      data: {
        course_id: courseId,
        step_type,
        title,
        content_url: content_url || null,
        order_index: order_index || 0,
        is_required: is_required ?? true,
        min_watch_percent: min_watch_percent || 95,
      },
    })

    return NextResponse.json(step, { status: 201 })
  } catch (error) {
    console.error('[API] Create step error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params
  const steps = await prisma.courseStep.findMany({
    where: { course_id: courseId },
    include: { _count: { select: { questions: true } } },
    orderBy: { order_index: 'asc' },
  })
  return NextResponse.json(steps)
}
