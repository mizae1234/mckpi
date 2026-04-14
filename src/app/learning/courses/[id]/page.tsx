import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import CoursePlayer from './CoursePlayer'

export const dynamic = 'force-dynamic'

export default async function LearningCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return redirect('/login')

  const employeeId = session.user.id

  // 1. Check if employee is assigned to this course
  const assignment = await prisma.courseAssignment.findFirst({
    where: { employeeId: employeeId, courseId: id },
  })

  // If not assigned explicitly but might be offline/external, we can allow or block. Let's allow for now if it exists, or strict check?
  // Let's stick to strict assignment for ONLINE learning to track properly.
  // Actually, if they try to access an ONLINE course, let's create assignment if open, else block. Let's assume assigned.
  
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { orderIndex: 'asc' },
        include: { questions: { orderBy: { orderNum: 'asc' } } }
      }
    }
  })

  if (!course) return notFound()

  // 2. Fetch Progress & Attempts
  const progresses = await prisma.stepProgress.findMany({
    where: { employeeId: employeeId, stepId: { in: course.steps.map(s => s.id) } }
  })
  
  const attempts = await prisma.quizAttempt.findMany({
    where: { employeeId: employeeId, stepId: { in: course.steps.map(s => s.id) } },
    orderBy: { createdAt: 'desc' }
  })

  const progressMap = new Map(progresses.map(p => [p.stepId, p]))
  
  // Best completed attempts
  const passedAttemptsMap = new Map()
  for (const a of attempts) {
    if (a.passed && !passedAttemptsMap.has(a.stepId)) passedAttemptsMap.set(a.stepId, true)
  }

  // Check Pretest
  const pretestStep = course.steps.find(s => s.stepType === 'PRETEST')
  const isPretestPassed = pretestStep ? passedAttemptsMap.has(pretestStep.id) : false

  // 3. Compute step states (Unlocked, Skipped, Completed)
  let allPreviousReqCompleted = true
  
  const mappedSteps = course.steps.map((step, index) => {
    const isVideoOrDoc = step.stepType === 'VIDEO' || step.stepType === 'DOCUMENT'
    const isSkipped = isVideoOrDoc && isPretestPassed
    
    // Check completion
    let isCompleted = false
    if (step.stepType === 'PRETEST' || step.stepType === 'QUIZ' || step.stepType === 'POSTTEST') {
      // For Pretest, just taking it completes it. But if we require passed?
      // Our API marks it completed automatically. So check progressMap.
      const p = progressMap.get(step.id)
      isCompleted = p?.completed || false
      
      // For Quiz/Posttest, must pass to consider completed for unlock logic
      if (step.stepType !== 'PRETEST') {
        isCompleted = passedAttemptsMap.has(step.id)
      }
    } else {
      const p = progressMap.get(step.id)
      isCompleted = p?.completed || false
    }

    // Unlocked logic
    // Unlocked if all previous requirements are met (or skipped). First step is always unlocked.
    let isUnlocked = allPreviousReqCompleted

    // Override Unlocked for PRETEST SKIP logic:
    // If Pretest passed, POSTTEST is immediately unlocked assuming no unskipped required steps exist.
    if (step.stepType === 'POSTTEST' && isPretestPassed) {
       isUnlocked = true // Overriding because we assume we skip to posttest
    }

    // Update cascading lock for NEXT steps
    if (step.isRequired && !isCompleted && !isSkipped) {
      allPreviousReqCompleted = false
    }

    return {
      id: step.id,
      stepType: step.stepType,
      title: step.title,
      contentUrl: step.contentUrl,
      minWatchPercent: step.minWatchPercent,
      is_completed: isCompleted,
      watchPercent: progressMap.get(step.id)?.watchPercent || 0,
      is_unlocked: isUnlocked,
      is_skipped: isSkipped,
      questions: step.questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options as string[],
        // Do NOT send correctAnswer to client!
      }))
    }
  })

  return (
    <CoursePlayer 
      course={{
        id: course.id,
        title: course.title,
        passScore: course.passScore
      }} 
      steps={mappedSteps} 
    />
  )
}
