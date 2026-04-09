import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const quizConfig = await prisma.quizConfig.findFirst()
  const numQuestions = quizConfig?.num_questions || 10

  // Get random active questions
  const allQuestions = await prisma.question.findMany({
    where: { is_active: true },
    select: { id: true, question_text: true, options: true },
  })

  // Shuffle, pick, and parse options
  const shuffled = allQuestions.sort(() => Math.random() - 0.5)
  const questions = shuffled.slice(0, numQuestions).map((q: any) => ({
    ...q,
    options: JSON.parse(q.options)
  }))

  return NextResponse.json({ questions })
}
