import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  try {
    const r1 = await prisma.offlineRegistration.deleteMany()
    const r2 = await prisma.quizAttempt.deleteMany()
    const r3 = await prisma.stepProgress.deleteMany()
    const r4 = await prisma.trainingResult.deleteMany()
    const r5 = await prisma.courseAssignment.deleteMany()
    return NextResponse.json({ 
      success: true, 
      deleted: {
        registrations: r1.count,
        quizAttempts: r2.count,
        stepProgress: r3.count,
        trainingResults: r4.count,
        assignments: r5.count,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
