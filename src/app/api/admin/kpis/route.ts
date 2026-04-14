import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    const where = year ? { year: parseInt(year) } : {}

    const kpis = await prisma.kpi.findMany({
      where,
      include: {
        courses: {
          include: {
            course: { select: { id: true, code: true, title: true, trainingType: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { code: 'asc' }],
    })

    return NextResponse.json(kpis)
  } catch (error) {
    console.error('[API] List KPIs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, target, year } = body

    if (!name || !year) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อ KPI และปี' }, { status: 400 })
    }

    // Auto-generate code: KPI-{year}-{seq}
    const existingCount = await prisma.kpi.count({ where: { year: parseInt(year) } })
    const seq = String(existingCount + 1).padStart(3, '0')
    const code = `KPI-${year}-${seq}`

    const kpi = await prisma.kpi.create({
      data: {
        code,
        name,
        target: target || '',
        year: parseInt(year),
      },
      include: {
        courses: {
          include: {
            course: { select: { id: true, code: true, title: true, trainingType: true } },
          },
        },
      },
    })

    return NextResponse.json(kpi, { status: 201 })
  } catch (error) {
    console.error('[API] Create KPI error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
