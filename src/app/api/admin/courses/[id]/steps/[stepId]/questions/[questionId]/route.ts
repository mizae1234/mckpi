import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string; questionId: string }> }
) {
  try {
    const { questionId } = await params
    const body = await request.json()
    const { questionText, options, correctAnswer, orderNum } = body

    if (!questionText || !Array.isArray(options) || options.length < 2 || typeof correctAnswer !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        questionText,
        options,
        correctAnswer,
        orderNum: orderNum ?? 0,
      },
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error('[API] Update question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string; questionId: string }> }
) {
  try {
    const { questionId } = await params

    await prisma.question.delete({
      where: { id: questionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Delete question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
