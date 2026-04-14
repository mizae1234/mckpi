import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromYear, toYear } = body

    if (!fromYear || !toYear || fromYear === toYear) {
      return NextResponse.json({ error: 'กรุณาระบุปีต้นทางและปีปลายทาง' }, { status: 400 })
    }

    // Get KPIs from source year
    const sourceKpis = await prisma.kpi.findMany({
      where: { year: parseInt(fromYear) },
      orderBy: { code: 'asc' },
    })

    if (sourceKpis.length === 0) {
      return NextResponse.json({ error: `ไม่พบ KPI ในปี ${fromYear}` }, { status: 400 })
    }

    // Check existing KPIs in target year
    const existingCount = await prisma.kpi.count({ where: { year: parseInt(toYear) } })

    // Create new KPIs in target year
    const created = []
    for (let i = 0; i < sourceKpis.length; i++) {
      const src = sourceKpis[i]
      const seq = String(existingCount + i + 1).padStart(3, '0')
      const code = `KPI-${toYear}-${seq}`

      const kpi = await prisma.kpi.create({
        data: {
          code,
          name: src.name,
          target: src.target,
          year: parseInt(toYear),
        },
      })
      created.push(kpi)
    }

    return NextResponse.json({ created: created.length, kpis: created }, { status: 201 })
  } catch (error) {
    console.error('[API] Copy KPIs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
