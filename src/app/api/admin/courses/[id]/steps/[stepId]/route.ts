import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFromR2, getR2KeyFromUrl } from '@/lib/r2'

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { stepId } = await params

    // Fetch the step first to check if it has a file on R2
    const step = await prisma.courseStep.findUnique({ where: { id: stepId } })
    if (!step) {
      return NextResponse.json({ error: 'ไม่พบขั้นตอน' }, { status: 404 })
    }

    // Delete the file from R2 if the contentUrl points to our R2 bucket
    if (step.contentUrl && R2_PUBLIC_URL && step.contentUrl.startsWith(R2_PUBLIC_URL)) {
      try {
        const key = getR2KeyFromUrl(step.contentUrl)
        await deleteFromR2(key)
        console.log('[API] Deleted R2 file:', key)
      } catch (r2Error) {
        console.error('[API] Failed to delete R2 file (continuing):', r2Error)
      }
    }

    await prisma.courseStep.delete({ where: { id: stepId } })

    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('[API] Delete step error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
