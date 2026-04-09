import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const driverId = session.user.id
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      video_progress: true,
      quiz_attempts: { orderBy: { created_at: 'desc' } },
      certificates: { where: { status: 'VALID' }, take: 1 },
    },
  })

  if (!driver) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
  }

  const videoProgress = driver.video_progress[0]
  const bestQuiz = driver.quiz_attempts.find(a => a.passed)
  const quizConfig = await prisma.quizConfig.findFirst()
  const certificate = driver.certificates[0]

  const videoProg = videoProgress && videoProgress.total_duration > 0
    ? (videoProgress.max_watched_time / videoProgress.total_duration) * 100
    : 0

  return NextResponse.json({
    videoProgress: Math.min(videoProg, 100),
    videoCompleted: videoProgress?.completed || false,
    quizPassed: !!bestQuiz,
    quizAttempts: driver.quiz_attempts.length,
    maxAttempts: quizConfig?.max_attempts || 3,
    quizScore: bestQuiz ? bestQuiz.score : null,
    certificateNo: certificate?.certificate_no || null,
    onboardingStatus: driver.onboarding_status,
  })
}
