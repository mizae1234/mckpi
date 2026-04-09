import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const questions = await prisma.question.findMany({
    orderBy: { order_num: 'asc' },
  })

  const config = await prisma.quizConfig.findFirst()

  return NextResponse.json({ questions, config })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { question_text, options, correct_answer } = body

  if (!question_text || !options || correct_answer === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const maxOrder = await prisma.question.aggregate({ _max: { order_num: true } })
  const question = await prisma.question.create({
    data: {
      question_text,
      options,
      correct_answer,
      order_num: (maxOrder._max.order_num || 0) + 1,
    },
  })

  return NextResponse.json(question, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, question_text, options, correct_answer, is_active } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  const question = await prisma.question.update({
    where: { id },
    data: {
      ...(question_text && { question_text }),
      ...(options && { options }),
      ...(correct_answer !== undefined && { correct_answer }),
      ...(is_active !== undefined && { is_active }),
    },
  })

  return NextResponse.json(question)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  await prisma.question.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
