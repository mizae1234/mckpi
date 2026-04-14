import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const body = await request.json()
    const { stepType, title, contentUrl, contentFilename, orderIndex, isRequired, minWatchPercent } = body

    if (!stepType || !title) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 })
    }

    const step = await prisma.courseStep.create({
      data: {
        courseId: courseId,
        stepType,
        title,
        contentUrl: contentUrl || null,
        contentFilename: contentFilename || null,
        orderIndex: orderIndex || 0,
        isRequired: isRequired ?? true,
        minWatchPercent: minWatchPercent || 95,
      },
      include: { _count: { select: { questions: true } } },
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
    where: { courseId: courseId },
    include: { _count: { select: { questions: true } } },
    orderBy: { orderIndex: 'asc' },
  })
  return NextResponse.json(steps)
}
