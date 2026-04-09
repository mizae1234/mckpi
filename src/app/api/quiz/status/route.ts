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

  // Check video completion
  const video = await prisma.video.findFirst({ where: { is_active: true } })
  const videoProgress = video ? await prisma.videoProgress.findUnique({
    where: { driver_id_video_id: { driver_id: driverId, video_id: video.id } },
  }) : null

  const quizConfig = await prisma.quizConfig.findFirst()
  const attempts = await prisma.quizAttempt.findMany({
    where: { driver_id: driverId },
    orderBy: { created_at: 'desc' },
  })

  const alreadyPassed = attempts.some(a => a.passed)
  const canTakeQuiz = videoProgress?.completed === true && 
    !alreadyPassed && 
    attempts.length < (quizConfig?.max_attempts || 3)

  return NextResponse.json({
    canTakeQuiz,
    attemptsUsed: attempts.length,
    maxAttempts: quizConfig?.max_attempts || 3,
    passScore: quizConfig?.pass_score || 80,
    alreadyPassed,
  })
}
