import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, title, description, trainingType, passScore, creditHours, isMandatory, kpiIds } = body

    const dataToUpdate: any = {}
    if (status !== undefined) dataToUpdate.status = status
    if (title !== undefined) dataToUpdate.title = title
    if (description !== undefined) dataToUpdate.description = description || ''
    if (trainingType !== undefined) dataToUpdate.trainingType = trainingType
    if (passScore !== undefined) dataToUpdate.passScore = passScore
    if (creditHours !== undefined) dataToUpdate.creditHours = creditHours
    if (isMandatory !== undefined) dataToUpdate.isMandatory = isMandatory

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: dataToUpdate,
    })

    // Sync KPI mappings if provided
    if (kpiIds !== undefined && Array.isArray(kpiIds)) {
      await prisma.kpiCourse.deleteMany({ where: { courseId: id } })
      if (kpiIds.length > 0) {
        await prisma.kpiCourse.createMany({
          data: kpiIds.map((kpiId: string) => ({ kpiId, courseId: id })),
          skipDuplicates: true,
        })
      }
    }

    return NextResponse.json(updatedCourse, { status: 200 })
  } catch (error) {
    console.error('[API] Update course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.course.delete({ where: { id } })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[API] Delete course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
