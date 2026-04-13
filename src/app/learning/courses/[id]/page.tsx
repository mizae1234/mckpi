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
    where: { employee_id: employeeId, course_id: id },
  })

  // If not assigned explicitly but might be offline/external, we can allow or block. Let's allow for now if it exists, or strict check?
  // Let's stick to strict assignment for ONLINE learning to track properly.
  // Actually, if they try to access an ONLINE course, let's create assignment if open, else block. Let's assume assigned.
  
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { order_index: 'asc' },
        include: { questions: { orderBy: { order_num: 'asc' } } }
      }
    }
  })

  if (!course) return notFound()

  // 2. Fetch Progress & Attempts
  const progresses = await prisma.stepProgress.findMany({
    where: { employee_id: employeeId, step_id: { in: course.steps.map(s => s.id) } }
  })
  
  const attempts = await prisma.quizAttempt.findMany({
    where: { employee_id: employeeId, step_id: { in: course.steps.map(s => s.id) } },
    orderBy: { created_at: 'desc' }
  })

  const progressMap = new Map(progresses.map(p => [p.step_id, p]))
  
  // Best completed attempts
  const passedAttemptsMap = new Map()
  for (const a of attempts) {
    if (a.passed && !passedAttemptsMap.has(a.step_id)) passedAttemptsMap.set(a.step_id, true)
  }

  // Check Pretest
  const pretestStep = course.steps.find(s => s.step_type === 'PRETEST')
  const isPretestPassed = pretestStep ? passedAttemptsMap.has(pretestStep.id) : false

  // 3. Compute step states (Unlocked, Skipped, Completed)
  let allPreviousReqCompleted = true
  
  const mappedSteps = course.steps.map((step, index) => {
    const isVideoOrDoc = step.step_type === 'VIDEO' || step.step_type === 'DOCUMENT'
    const isSkipped = isVideoOrDoc && isPretestPassed
    
    // Check completion
    let isCompleted = false
    if (step.step_type === 'PRETEST' || step.step_type === 'QUIZ' || step.step_type === 'POSTTEST') {
      // For Pretest, just taking it completes it. But if we require passed?
      // Our API marks it completed automatically. So check progressMap.
      const p = progressMap.get(step.id)
      isCompleted = p?.completed || false
      
      // For Quiz/Posttest, must pass to consider completed for unlock logic
      if (step.step_type !== 'PRETEST') {
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
    if (step.step_type === 'POSTTEST' && isPretestPassed) {
       isUnlocked = true // Overriding because we assume we skip to posttest
    }

    // Update cascading lock for NEXT steps
    if (step.is_required && !isCompleted && !isSkipped) {
      allPreviousReqCompleted = false
    }

    return {
      id: step.id,
      step_type: step.step_type,
      title: step.title,
      content_url: step.content_url,
      min_watch_percent: step.min_watch_percent,
      is_completed: isCompleted,
      watch_percent: progressMap.get(step.id)?.watch_percent || 0,
      is_unlocked: isUnlocked,
      is_skipped: isSkipped,
      questions: step.questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options as string[],
        // Do NOT send correct_answer to client!
      }))
    }
  })

  return (
    <CoursePlayer 
      course={{
        id: course.id,
        title: course.title,
        pass_score: course.pass_score
      }} 
      steps={mappedSteps} 
    />
  )
}
