import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'

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
    // Sanitize filename to prevent issues in URLs/R2
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const key = `courses/${courseId}/${timestamp}-${safeName}`

    const url = await uploadToR2(buffer, key, file.type || 'application/octet-stream')

    return NextResponse.json({ url, filename: file.name }, { status: 200 })
  } catch (error) {
    console.error('[API] Upload error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลด' }, { status: 500 })
  }
}
