import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToR2, deleteFromR2, getR2KeyFromUrl } from '@/lib/r2'

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

// GET - List all documents for a course
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params
  const documents = await prisma.courseDocument.findMany({
    where: { courseId: courseId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(documents)
}

// POST - Upload a new document to a course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const key = `courses/${courseId}/docs/${timestamp}-${safeName}`

    const fileUrl = await uploadToR2(buffer, key, file.type || 'application/octet-stream')

    const doc = await prisma.courseDocument.create({
      data: {
        courseId: courseId,
        filename: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        fileType: file.type || '',
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('[API] Upload document error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลด' }, { status: 500 })
  }
}

// DELETE - Delete a specific document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('docId')

    if (!docId) {
      return NextResponse.json({ error: 'ไม่พบ docId' }, { status: 400 })
    }

    const doc = await prisma.courseDocument.findUnique({ where: { id: docId } })
    if (!doc) {
      return NextResponse.json({ error: 'ไม่พบเอกสาร' }, { status: 404 })
    }

    // Delete file from R2
    if (doc.fileUrl && R2_PUBLIC_URL && doc.fileUrl.startsWith(R2_PUBLIC_URL)) {
      try {
        const key = getR2KeyFromUrl(doc.fileUrl)
        await deleteFromR2(key)
        console.log('[API] Deleted R2 document:', key)
      } catch (r2Error) {
        console.error('[API] Failed to delete R2 document (continuing):', r2Error)
      }
    }

    await prisma.courseDocument.delete({ where: { id: docId } })

    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('[API] Delete document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
