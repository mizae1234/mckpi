import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const body = await request.json()
    const { items } = body // [{ stepId: string, orderIndex: number }]

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing items' }, { status: 400 })
    }

    await prisma.$transaction(
      items.map((item: { stepId: string; orderIndex: number }) =>
        prisma.courseStep.update({
          where: { id: item.stepId },
          data: { orderIndex: item.orderIndex },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Reorder steps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
