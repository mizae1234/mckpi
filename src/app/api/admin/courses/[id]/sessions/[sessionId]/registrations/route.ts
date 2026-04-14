import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  try {
    const { sessionId } = await params

    const registrations = await prisma.offlineRegistration.findMany({
      where: { sessionId },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            branchCode: true,
            departmentCode: true,
          }
        }
      },
      orderBy: { registeredAt: 'asc' }
    })

    return NextResponse.json(registrations)
  } catch (error: any) {
    console.error('[API] Get registrations error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  try {
    const body = await request.json()
    const { registrationId, status } = body

    if (!registrationId || !status) {
      return NextResponse.json({ error: 'Missing registrationId or status' }, { status: 400 })
    }

    const validStatuses = ['REGISTERED', 'WAITLISTED', 'ATTENDED', 'CANCELLED', 'NO_SHOW']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { id: courseId } = await params
    
    // Wrap in a transaction to handle Hybrid Passing Logic
    const registration = await prisma.$transaction(async (tx) => {
      const reg = await tx.offlineRegistration.update({
        where: { id: registrationId },
        data: { status },
        include: {
          employee: {
            select: { id: true, employeeCode: true, fullName: true, branchCode: true, departmentCode: true }
          }
        }
      })

      // Hybrid Passing Logic
      if (status === 'ATTENDED') {
        const course = await tx.course.findUnique({
          where: { id: courseId },
          include: { _count: { select: { steps: true } } }
        })

        // If the Course has NO steps (no online quiz), passing attendance means passing the course.
        if (course && course._count.steps === 0) {
          // Check if TrainingResult exists, if so update to PASSED, else create as PASSED.
          const tr = await tx.trainingResult.findFirst({
            where: { employeeId: reg.employeeId, courseId: courseId }
          })
          
          if (tr) {
            await tx.trainingResult.update({
              where: { id: tr.id },
              data: { status: 'PASSED', completedAt: new Date(), score: 100 }
            })
          } else {
            await tx.trainingResult.create({
              data: {
                employeeId: reg.employeeId,
                courseId: courseId,
                source: 'OFFLINE',
                status: 'PASSED',
                completedAt: new Date(),
                score: 100
              }
            })
          }
        }
      }

      return reg
    })

    return NextResponse.json(registration)
  } catch (error: any) {
    console.error('[API] Update registration error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
