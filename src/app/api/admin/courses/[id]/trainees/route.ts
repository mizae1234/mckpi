import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Admin manually adds a trainee to a course
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: courseId } = await params
    const { employeeIds, sessionId, status } = await request.json()

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ error: 'กรุณาเลือกพนักงาน' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'ไม่พบหลักสูตร' }, { status: 404 })

    if (course.trainingType === 'OFFLINE') {
      // Classroom: Add to a specific session as OfflineRegistration
      if (!sessionId) {
        return NextResponse.json({ error: 'กรุณาเลือกรอบอบรม' }, { status: 400 })
      }

      // Check existing registrations for this session
      const existing = await prisma.offlineRegistration.findMany({
        where: { employeeId: { in: employeeIds }, sessionId, status: { not: 'CANCELLED' } },
        select: { employeeId: true }
      })
      const existingIds = new Set(existing.map(e => e.employeeId))
      const newEmployeeIds = employeeIds.filter(id => !existingIds.has(id))

      if (newEmployeeIds.length > 0) {
        // Bulk Insert Offline Registration
        await prisma.offlineRegistration.createMany({
          data: newEmployeeIds.map(empId => ({
            employeeId: empId,
            sessionId,
            status: status || 'REGISTERED',
          })),
          skipDuplicates: true
        })

        // Bulk Insert or Update TrainingResult (IN_PROGRESS)
        // Since Prisma doesn't support bulk upsert easily, we fetch existing ones and create missing
        const existingResults = await prisma.trainingResult.findMany({
          where: { employeeId: { in: newEmployeeIds }, courseId, source: 'OFFLINE' },
          select: { employeeId: true }
        })
        const resultIds = new Set(existingResults.map(e => e.employeeId))
        const missingResultIds = newEmployeeIds.filter(id => !resultIds.has(id))

        if (missingResultIds.length > 0) {
          await prisma.trainingResult.createMany({
            data: missingResultIds.map(empId => ({
              employeeId: empId,
              courseId,
              source: 'OFFLINE',
              status: 'IN_PROGRESS'
            })),
            skipDuplicates: true
          })
        }
      }

      return NextResponse.json({ success: true, addedCount: newEmployeeIds.length }, { status: 201 })

    } else {
      // Online/External: Create TrainingResult directly
      const sourceVal = course.trainingType === 'EXTERNAL' ? 'EXTERNAL' : 'ONLINE'
      const existing = await prisma.trainingResult.findMany({
        where: { employeeId: { in: employeeIds }, courseId, source: sourceVal },
        select: { employeeId: true }
      })
      const existingIds = new Set(existing.map(e => e.employeeId))
      const newEmployeeIds = employeeIds.filter(id => !existingIds.has(id))

      if (newEmployeeIds.length > 0) {
        await prisma.trainingResult.createMany({
          data: newEmployeeIds.map(empId => ({
            employeeId: empId,
            courseId,
            source: sourceVal,
            status: status || 'IN_PROGRESS',
          })),
          skipDuplicates: true
        })
      }

      return NextResponse.json({ success: true, addedCount: newEmployeeIds.length }, { status: 201 })
    }
  } catch (error: any) {
    console.error('[API] Admin add trainee error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
