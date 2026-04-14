import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { evaluateCourseCompletion } from '@/lib/course-eval'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employeeId = session.user.id
    const body = await request.json()
    const { stepId, courseId, answers } = body // answers: Record<string, number> where key is question_id and value is selected option index

    if (!stepId || !courseId || !answers) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const step = await prisma.courseStep.findUnique({
      where: { id: stepId },
      include: { questions: true, course: true },
    })

    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })

    // Calculate score
    let correctCount = 0
    const totalQuestions = step.questions.length

    if (totalQuestions === 0) {
      return NextResponse.json({ error: 'No questions found for this step' }, { status: 400 })
    }

    for (const q of step.questions) {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++
      }
    }

    const score = Math.round((correctCount / totalQuestions) * 100)
    
    // Check if passed (based on course passScore, except pretest which is not strictly fail-blocking but determines skip)
    // Actually schema says passScore is at course level.
    const isPassed = score >= step.course.passScore

    const attemptCount = await prisma.quizAttempt.count({
      where: { employeeId: employeeId, stepId },
    })

    // Save attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        employeeId: employeeId,
        stepId,
        score,
        passed: isPassed,
        answers,
        attemptNo: attemptCount + 1,
      },
    })

    // If pre-test, we always mark step progress as completed so they can proceed, regardless of pass/fail.
    // If Quiz/Post-test, we only mark step progress as completed if they passed.
    const shouldCompleteStep = step.stepType === 'PRETEST' || isPassed

    if (shouldCompleteStep) {
      await prisma.stepProgress.upsert({
        where: { employeeId_stepId: { employeeId: employeeId, stepId: step.id } },
        update: { completed: true, watchPercent: 100 },
        create: { employeeId: employeeId, stepId: step.id, completed: true, watchPercent: 100 },
      })
    }

    // Trigger evaluation to check if course is completed or if skip logic needs to be executed
    await evaluateCourseCompletion(employeeId, courseId)

    return NextResponse.json({
      score,
      is_passed: isPassed,
      attempt_id: attempt.id,
      correct_count: correctCount,
      total_questions: totalQuestions,
      should_complete_step: shouldCompleteStep
    })

  } catch (error: any) {
    console.error('[API] Quiz submission error:', error)
    const errObj = error instanceof Error ? error.message : JSON.stringify(error)
    return NextResponse.json({ error: errObj }, { status: 500 })
  }
}
