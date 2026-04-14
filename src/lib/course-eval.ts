import { prisma } from './prisma'

export async function evaluateCourseCompletion(employeeId: string, courseId: string) {
  // 1. Fetch course steps ordered by orderIndex
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      steps: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  })
  
  if (!course) return false

  // 2. Fetch employee's progress on these steps
  const progresses = await prisma.stepProgress.findMany({
    where: { employeeId: employeeId, stepId: { in: course.steps.map(s => s.id) } },
  })

  // 3. Fetch employee's quiz attempts on these steps (specifically for PRETEST/PASSED check)
  const attempts = await prisma.quizAttempt.findMany({
    where: { employeeId: employeeId, stepId: { in: course.steps.map(s => s.id) } },
    orderBy: { createdAt: 'desc' }, // newest first
  })

  // Group progress and attempts by stepId for quick access
  const progressMap = new Map(progresses.map(p => [p.stepId, p]))
  
  // For attempts, we only care if they passed
  const passedAttemptsMap = new Map()
  for (const attempt of attempts) {
    if (attempt.passed && !passedAttemptsMap.has(attempt.stepId)) {
      passedAttemptsMap.set(attempt.stepId, true)
    }
  }

  // 4. Implement Skip Logic Check
  // Determine if Pre-test was passed
  const pretestStep = course.steps.find(s => s.stepType === 'PRETEST')
  const isPretestPassed = pretestStep ? passedAttemptsMap.has(pretestStep.id) : false

  // 5. Evaluate overall completion
  let isCourseCompleted = true
  let overallScore = 0
  let scoreCount = 0

  for (const step of course.steps) {
    // If it's a POSTTEST and Pre-test was passed, it is required, but we skip checking intermediate videos.
    // If Pre-test is passed, we ONLY require POSTTEST (and PRETEST itself) to be completed.
    
    // Calculate if this step is technically "Skipped"
    const isVideoOrDoc = step.stepType === 'VIDEO' || step.stepType === 'DOCUMENT'
    const isSkipped = isVideoOrDoc && isPretestPassed

    if (step.isRequired && !isSkipped) {
      if (step.stepType === 'QUIZ' || step.stepType === 'POSTTEST') {
        if (!passedAttemptsMap.has(step.id)) {
          isCourseCompleted = false
          break
        }
        // Get the best score for final calculation
        const bestAttempt = attempts.find(a => a.stepId === step.id && a.passed)
        if (bestAttempt) {
          overallScore += bestAttempt.score
          scoreCount++
        }
      } else if (step.stepType === 'VIDEO' || step.stepType === 'DOCUMENT' || step.stepType === 'PRETEST') {
        const p = progressMap.get(step.id)
        if (!p || !p.completed) {
          isCourseCompleted = false
          break
        }
      }
    }
  }

  // 6. If completed, update models
  if (isCourseCompleted) {
    const finalAvgScore = scoreCount > 0 ? Math.round(overallScore / scoreCount) : 100

    // Update assignment
    const assignment = await prisma.courseAssignment.findFirst({
      where: { employeeId: employeeId, courseId: courseId },
    })

    if (assignment && assignment.status !== 'COMPLETED') {
      await prisma.courseAssignment.update({
        where: { id: assignment.id },
        data: { status: 'COMPLETED' },
      })
    }

    // Upsert TrainingResult
    await prisma.trainingResult.upsert({
      where: {
        employeeId_courseId_source: { employeeId: employeeId, courseId: courseId, source: course.trainingType },
      },
      update: {
        status: 'PASSED',
        score: finalAvgScore,
        completedAt: new Date(),
      },
      create: {
        employeeId: employeeId,
        courseId: courseId,
        source: course.trainingType,
        status: 'PASSED',
        score: finalAvgScore,
        completedAt: new Date(),
      },
    })

    // Issue Certificate if not already issued
    const existingCert = await prisma.certificate.findFirst({
      where: { employeeId: employeeId, courseId: courseId },
    })

    if (!existingCert) {
      const year = new Date().getFullYear().toString().slice(-2)
      const randomId = Math.random().toString(36).substring(2, 6).toUpperCase()
      const certNo = `CERT-${year}-${randomId}`

      await prisma.certificate.create({
        data: {
          employeeId: employeeId,
          courseId: courseId,
          certificateNo: certNo,
          score: finalAvgScore,
          issuedAt: new Date(),
        },
      })
    }
  }

  return isCourseCompleted
}
