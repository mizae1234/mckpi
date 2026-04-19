import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { stepId } = await params

    const questions = await prisma.question.findMany({
      where: { stepId },
      orderBy: { orderNum: 'asc' },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('[API] Get questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { stepId } = await params
    const body = await request.json()

    // Support bulk import from master question bank
    if (body.masterQuestionIds && Array.isArray(body.masterQuestionIds)) {
      const masterQuestions = await prisma.masterQuestion.findMany({
        where: { id: { in: body.masterQuestionIds } },
      })

      // Get current max orderNum for this step
      const maxOrder = await prisma.question.aggregate({
        where: { stepId },
        _max: { orderNum: true },
      })
      let nextOrder = (maxOrder._max.orderNum || 0) + 1

      const created = await prisma.$transaction(
        masterQuestions.map((mq) =>
          prisma.question.create({
            data: {
              stepId,
              questionText: mq.questionText,
              options: mq.options as import('@prisma/client').Prisma.InputJsonValue,
              correctAnswer: mq.correctAnswer,
              orderNum: nextOrder++,
              masterQuestionId: mq.id,
            },
          })
        )
      )

      return NextResponse.json(created, { status: 201 })
    }

    // Single question creation
    const { questionText, options, correctAnswer, orderNum } = body

    if (!questionText || !Array.isArray(options) || options.length < 2 || typeof correctAnswer !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }

    const question = await prisma.question.create({
      data: {
        stepId,
        questionText,
        options,
        correctAnswer,
        orderNum: orderNum || 0,
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('[API] Create question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
