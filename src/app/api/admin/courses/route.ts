import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, title, description, trainingType, passScore, isMandatory, status } = body

    if (!code || !title || !trainingType) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 })
    }

    const existing = await prisma.course.findUnique({ where: { code: code.toUpperCase() } })
    if (existing) {
      return NextResponse.json({ error: 'รหัสคอร์สนี้มีอยู่แล้ว' }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        code: code.toUpperCase(),
        title,
        description: description || '',
        trainingType,
        passScore: passScore || 80,
        isMandatory: isMandatory || false,
        status: status || 'DRAFT',
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('[API] Create course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { steps: true, sessions: true, assignments: true, results: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(courses)
  } catch (error) {
    console.error('[API] List courses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
