import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCertificateNo } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const driverId = session.user.id
  const body = await request.json()
  const { answers } = body // { questionId: selectedIndex }

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'Invalid answers' }, { status: 400 })
  }

  // Check eligibility
  const quizConfig = await prisma.quizConfig.findFirst()
  const existingAttempts = await prisma.quizAttempt.count({ where: { driver_id: driverId } })
  
  if (existingAttempts >= (quizConfig?.max_attempts || 3)) {
    return NextResponse.json({ error: 'Max attempts reached' }, { status: 400 })
  }

  const alreadyPassed = await prisma.quizAttempt.findFirst({
    where: { driver_id: driverId, passed: true },
  })
  if (alreadyPassed) {
    return NextResponse.json({ error: 'Already passed' }, { status: 400 })
  }

  // Fetch questions and check answers
  const questionIds = Object.keys(answers)
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  })

  let correct = 0
  const detailedAnswers = questions.map(q => {
    const selected = answers[q.id]
    const isCorrect = selected === q.correct_answer
    if (isCorrect) correct++
    return {
      question_id: q.id,
      selected,
      correct: q.correct_answer,
      is_correct: isCorrect,
    }
  })

  const score = questions.length > 0 ? (correct / questions.length) * 100 : 0
  const passed = score >= (quizConfig?.pass_score || 80)
  const attemptNo = existingAttempts + 1

  // Save attempt
  await prisma.quizAttempt.create({
    data: {
      driver_id: driverId,
      score,
      passed,
      attempt_no: attemptNo,
      answers: detailedAnswers,
    },
  })

  // If passed, generate certificate and update status
  if (passed) {
    const certNo = generateCertificateNo()
    await prisma.certificate.create({
      data: {
        certificate_no: certNo,
        driver_id: driverId,
        score,
      },
    })
    await prisma.driver.update({
      where: { id: driverId },
      data: { onboarding_status: 'PASSED' },
    })
  }

  return NextResponse.json({
    score,
    passed,
    attempt_no: attemptNo,
    answers: detailedAnswers,
  })
}
