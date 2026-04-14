import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import CoursePlayer from './CoursePlayer'
import CourseRegistration from './CourseRegistration'
import ClassroomCourseViewer from './ClassroomCourseViewer'

export const dynamic = 'force-dynamic'

export default async function LearningCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return redirect('/login')

  const employeeId = session.user.id

  // 1. Check if employee has registered (started) this online course
  const trainingResult = await prisma.trainingResult.findFirst({
    where: { employeeId: employeeId, courseId: id, source: 'ONLINE' }
  })
  
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { orderIndex: 'asc' },
        include: { questions: { orderBy: { orderNum: 'asc' } } }
      },
      sessions: {
        where: { sessionEndDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, // Only show upcoming or today's sessions
        orderBy: { sessionDate: 'asc' },
        include: { _count: { select: { registrations: { where: { status: { not: 'CANCELLED' } } } } } }
      }
    }
  })

  if (!course) return notFound()

  if (course.trainingType === 'OFFLINE') {
    const registrations = await prisma.offlineRegistration.findMany({
      where: { employeeId, session: { courseId: id } }
    })
    return <ClassroomCourseViewer course={course} sessions={course.sessions} myRegistrations={registrations} />
  }

  // If not registered, show Registration UI
  if (!trainingResult) {
    return <CourseRegistration course={course} />
  }

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

    const stepAttempts = attempts.filter(a => a.stepId === step.id)
    const latestAttemptScore = stepAttempts.length > 0 ? stepAttempts[0].score : null
    
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
      latestAttemptScore,
      questions: step.questions.map(q => {
        let parsedOptions: string[] = []
        try {
          parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (Array.isArray(q.options) ? q.options : [])
        } catch (e) {
          parsedOptions = []
        }
        return {
          id: q.id,
          questionText: q.questionText,
          options: parsedOptions,
          // Do NOT send correctAnswer to client!
        }
      })
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
