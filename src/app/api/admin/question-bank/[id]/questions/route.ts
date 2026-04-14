import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const questions = await prisma.masterQuestion.findMany({
      where: { questionSetId: id },
      orderBy: { orderNum: 'asc' },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('[API] Get master questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionSetId } = await params
    const body = await request.json()
    const { questionText, options, correctAnswer } = body

    if (!questionText || !Array.isArray(options) || options.length < 2 || typeof correctAnswer !== 'number') {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
    }

    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return NextResponse.json({ error: 'คำตอบที่ถูกต้องไม่ตรงกับตัวเลือก' }, { status: 400 })
    }

    // Get next orderNum
    const maxOrder = await prisma.masterQuestion.aggregate({
      where: { questionSetId },
      _max: { orderNum: true },
    })

    const question = await prisma.masterQuestion.create({
      data: {
        questionSetId,
        questionText,
        options,
        correctAnswer,
        orderNum: (maxOrder._max.orderNum || 0) + 1,
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('[API] Create master question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
