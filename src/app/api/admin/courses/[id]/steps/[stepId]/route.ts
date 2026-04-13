import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { stepId } = await params

    await prisma.courseStep.delete({ where: { id: stepId } })

    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('[API] Delete step error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
