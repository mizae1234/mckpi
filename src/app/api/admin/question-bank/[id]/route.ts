import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อชุดคำถาม' }, { status: 400 })
    }

    const set = await prisma.questionSet.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || '',
      },
    })

    return NextResponse.json(set)
  } catch (error) {
    console.error('[API] Update question set error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.questionSet.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Delete question set error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const set = await prisma.questionSet.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderNum: 'asc' },
        },
      },
    })

    if (!set) {
      return NextResponse.json({ error: 'ไม่พบชุดคำถาม' }, { status: 404 })
    }

    return NextResponse.json(set)
  } catch (error) {
    console.error('[API] Get question set error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
