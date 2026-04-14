import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, target } = body

    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อ KPI' }, { status: 400 })
    }

    const kpi = await prisma.kpi.update({
      where: { id },
      data: { name, target: target || '' },
      include: {
        courses: {
          include: {
            course: { select: { id: true, code: true, title: true, trainingType: true } },
          },
        },
      },
    })

    return NextResponse.json(kpi)
  } catch (error) {
    console.error('[API] Update KPI error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.kpi.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Delete KPI error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
