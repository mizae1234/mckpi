import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import * as xlsx from 'xlsx'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const courseQ = searchParams.get('courseQ') || ''
    const kpiId = searchParams.get('kpiId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const type = searchParams.get('type') || ''
    const mandatory = searchParams.get('mandatory') || ''
    const year = searchParams.get('year') || ''

    const where: Prisma.TrainingResultWhereInput = {}

    if (q) {
      where.employee = {
        OR: [
          { employeeCode: { contains: q, mode: 'insensitive' } },
          { fullName: { contains: q, mode: 'insensitive' } },
          { branchCode: { contains: q, mode: 'insensitive' } },
          { departmentCode: { contains: q, mode: 'insensitive' } },
          { positionCode: { contains: q, mode: 'insensitive' } },
        ],
      }
    }

    if (courseQ) {
      where.course = {
        ...where.course as object,
        OR: [
          { code: { contains: courseQ, mode: 'insensitive' } },
          { title: { contains: courseQ, mode: 'insensitive' } },
        ],
      }
    }

    if (kpiId) {
      where.course = {
        ...where.course as object,
        kpis: { some: { kpiId } },
      }
    }

    if (type) {
      where.course = {
        ...where.course as object,
        trainingType: type as any,
      }
    }

    if (year) {
      if (!startDate && !endDate) {
        const gte = new Date(`${year}-01-01T00:00:00.000Z`)
        const lte = new Date(`${year}-12-31T23:59:59.999Z`)
        where.completedAt = {
          ...((where.completedAt as Prisma.DateTimeNullableFilter) || {}),
          gte,
          lte,
        } as Prisma.DateTimeNullableFilter
      }
    }

    if (mandatory) {
      where.course = {
        ...where.course as object,
        isMandatory: mandatory === 'true',
      }
    }

    if (startDate || endDate) {
      const filter: Prisma.DateTimeNullableFilter = {}
      if (startDate) {
        filter.gte = new Date(`${startDate}T00:00:00.000Z`)
      }
      if (endDate) {
        filter.lte = new Date(`${endDate}T23:59:59.999Z`)
      }
      where.completedAt = {
        ...((where.completedAt as Prisma.DateTimeNullableFilter) || {}),
        ...filter
      } as Prisma.DateTimeNullableFilter
    }

    const results = await prisma.trainingResult.findMany({
      where,
      include: {
        employee: { select: { employeeCode: true, fullName: true, departmentCode: true, branchCode: true, positionCode: true } },
        course: { select: { code: true, title: true, trainingType: true, isMandatory: true } },
      },
      orderBy: { completedAt: 'desc' },
    })

    // Prepare data for Excel
    const data = results.map(r => ({
      'รหัสพนักงาน': r.employee.employeeCode || '-',
      'ชื่อ-นามสกุล': r.employee.fullName || '-',
      'ตำแหน่ง': r.employee.positionCode || '-',
      'สาขา': r.employee.branchCode || '-',
      'แผนก': r.employee.departmentCode || '-',
      'รหัสหลักสูตร': r.course.code || '-',
      'ชื่อหลักสูตร': r.course.title || '-',
      'ประเภทการอบรม': r.course.trainingType === 'OFFLINE' ? 'CLASSROOM' : r.course.trainingType,
      'บังคับ/ไม่บังคับ': r.course.isMandatory ? 'บังคับเรียน' : 'ทางเลือก',
      'สถานะ': r.status === 'PASSED' ? 'ผ่าน' : r.status === 'FAILED' ? 'ไม่ผ่าน' : 'กำลังเรียน',
      'วันที่สำเร็จ': r.completedAt ? new Date(r.completedAt).toLocaleDateString('th-TH') : '-',
      'คะแนน Pretest': r.pretestScore != null ? r.pretestScore : '-',
      'คะแนน Posttest': r.posttestScore != null ? r.posttestScore : '-',
      'คะแนนแบบทดสอบ': r.score != null ? r.score : '-',
    }))

    // Create workbook and worksheet
    const headers = [
      'รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'สาขา', 'แผนก', 
      'รหัสหลักสูตร', 'ชื่อหลักสูตร', 'ประเภทการอบรม', 'บังคับ/ไม่บังคับ', 
      'สถานะ', 'วันที่สำเร็จ', 'คะแนน Pretest', 'คะแนน Posttest', 'คะแนนแบบทดสอบ'
    ]
    let worksheet
    if (data.length === 0) {
      worksheet = xlsx.utils.aoa_to_sheet([headers])
    } else {
      worksheet = xlsx.utils.json_to_sheet(data, { header: headers })
    }
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Training Results')

    // Generate buffer
    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return as downloadable file
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="training_results_export.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (error: any) {
    console.error('[API] Export results error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
