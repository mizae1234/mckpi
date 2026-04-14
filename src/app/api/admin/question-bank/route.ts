import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sets = await prisma.questionSet.findMany({
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(sets)
  } catch (error) {
    console.error('[API] Get question sets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อชุดคำถาม' }, { status: 400 })
    }

    const set = await prisma.questionSet.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
      },
    })

    return NextResponse.json(set, { status: 201 })
  } catch (error) {
    console.error('[API] Create question set error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
