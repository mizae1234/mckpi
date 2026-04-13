import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authMiddleware } from '@/lib/auth-edge'
import { evaluateCourseCompletion } from '@/lib/course-eval'

export const POST = authMiddleware(async (request: NextRequest) => {
  try {
    const session = await (request as any).auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employeeId = session.user.id
    const body = await request.json()
    const { step_id, course_id, answers } = body // answers: Record<string, number> where key is question_id and value is selected option index

    if (!step_id || !course_id || !answers) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const step = await prisma.courseStep.findUnique({
      where: { id: step_id },
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
      if (answers[q.id] === q.correct_answer) {
        correctCount++
      }
    }

    const score = Math.round((correctCount / totalQuestions) * 100)
    
    // Check if passed (based on course pass_score, except pretest which is not strictly fail-blocking but determines skip)
    // Actually schema says pass_score is at course level.
    const isPassed = score >= step.course.pass_score

    const attemptCount = await prisma.quizAttempt.count({
      where: { employee_id: employeeId, step_id },
    })

    // Save attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        employee_id: employeeId,
        step_id,
        score,
        passed: isPassed,
        answers,
        attempt_no: attemptCount + 1,
      },
    })

    // If pre-test, we always mark step progress as completed so they can proceed, regardless of pass/fail.
    // If Quiz/Post-test, we only mark step progress as completed if they passed.
    const shouldCompleteStep = step.step_type === 'PRETEST' || isPassed

    if (shouldCompleteStep) {
      await prisma.stepProgress.upsert({
        where: { employee_id_step_id: { employee_id: employeeId, step_id: step.id } },
        update: { completed: true, watch_percent: 100 },
        create: { employee_id: employeeId, step_id: step.id, completed: true, watch_percent: 100 },
      })
    }

    // Trigger evaluation to check if course is completed or if skip logic needs to be executed
    await evaluateCourseCompletion(employeeId, course_id)

    return NextResponse.json({
      score,
      is_passed: isPassed,
      attempt_id: attempt.id,
      correct_count: correctCount,
      total_questions: totalQuestions,
      should_complete_step: shouldCompleteStep
    })

  } catch (error) {
    console.error('[API] Quiz submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}) as any
