import { prisma } from '@/lib/prisma'
import { BarChart3 } from 'lucide-react'
import ResultsFilterClient from './ResultsFilterClient'
import { Prisma } from '@prisma/client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const q = params.q || ''
  const courseQ = params.courseQ || ''
  const kpiId = params.kpiId || ''
  const startDate = params.startDate || ''
  const endDate = params.endDate || ''
  const type = params.type || ''
  const mandatory = params.mandatory || ''
  const year = params.year || ''
  const page = parseInt(params.page || '1', 10)
  const pageSize = 50

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

  // Use year to filter by completedAt dates, so extracurricular (non-KPI) courses still show up.
  if (year) {
    // Only apply year boundaries if specific startDate/endDate aren't overriding it
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

  const kpis = await prisma.kpi.findMany({
    select: { id: true, code: true, name: true, year: true },
    orderBy: { year: 'desc' }
  })

  const total = await prisma.trainingResult.count({ where })
  const totalPages = Math.ceil(total / pageSize)

  const results = await prisma.trainingResult.findMany({
    where,
    include: {
      employee: { select: { employeeCode: true, fullName: true, departmentCode: true, branchCode: true } },
      course: { select: { code: true, title: true, trainingType: true, isMandatory: true } },
    },
    orderBy: { completedAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  // Helper for pagination links
  const createPageUrl = (p: number) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (courseQ) sp.set('courseQ', courseQ)
    if (kpiId) sp.set('kpiId', kpiId)
    if (startDate) sp.set('startDate', startDate)
    if (endDate) sp.set('endDate', endDate)
    if (type) sp.set('type', type)
    if (mandatory) sp.set('mandatory', mandatory)
    if (year) sp.set('year', year)
    sp.set('page', p.toString())
    return `?${sp.toString()}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED': return 'badge-success'
      case 'FAILED': return 'badge-danger'
      default: return 'badge-warning'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PASSED': return 'ผ่าน'
      case 'FAILED': return 'ไม่ผ่าน'
      default: return 'กำลังเรียน'
    }
  }

  const getSourceInfo = (source: string) => {
    switch (source) {
      case 'ONLINE': return { label: 'Online', class: 'bg-blue-100 text-blue-700' }
      case 'OFFLINE': return { label: 'Classroom', class: 'bg-green-100 text-green-700' }
      case 'EXTERNAL': return { label: 'External', class: 'bg-purple-100 text-purple-700' }
      case 'IMPORT': return { label: 'นำเข้าข้อมูล', class: 'bg-gray-100 text-gray-700 border border-gray-300' }
      default: return { label: source, class: 'bg-gray-100 text-gray-700' }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">ผลลัพธ์การอบรม</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">ประมวลผลผลการอบรมทั้งหมดจากส่วนกลาง (Online / Offline / External)</p>
      </div>

      <ResultsFilterClient kpis={kpis} />

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>พนักงาน</th>
              <th>คอร์ส</th>
              <th>ประเภท</th>
              <th className="text-center">Pretest</th>
              <th className="text-center">Posttest</th>
              <th className="text-center">ผลการประเมิน</th>
              <th>สถานะ</th>
              <th>วันที่สำเร็จ</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-[var(--color-text-secondary)]">ยังไม่มีผลลัพธ์</p>
                </td>
              </tr>
            ) : (
              results.map((r) => {
                const sourceInfo = getSourceInfo(r.source)
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium">{r.employee.fullName}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{r.employee.employeeCode}</div>
                    </td>
                    <td>
                      <div className="font-medium">{r.course.title}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        {r.course.code}
                        {r.course.isMandatory && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">บังคับ</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${sourceInfo.class}`}>{sourceInfo.label}</span>
                    </td>
                    <td className="text-center font-mono text-gray-500">{r.pretestScore != null ? `${r.pretestScore}%` : '-'}</td>
                    <td className="text-center font-mono text-gray-500">{r.posttestScore != null ? `${r.posttestScore}%` : '-'}</td>
                    <td className="text-center font-semibold text-primary">{r.score != null ? `${r.score}%` : '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(r.status)}`}>{getStatusLabel(r.status)}</span>
                    </td>
                    <td>{r.completedAt ? new Date(r.completedAt).toLocaleDateString('th-TH') : '-'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4 mt-6">
          <div className="text-sm text-gray-500">
            แสดง {((page - 1) * pageSize) + 1} ถึง {Math.min(page * pageSize, total)} จาก {total} รายการ
          </div>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={createPageUrl(page - 1)} className="px-3 py-1 text-sm border border-[var(--color-border)] rounded-md hover:bg-gray-50 text-gray-700 transition">
                ก่อนหน้า
              </Link>
            )}
            
            <span className="px-3 py-1 text-sm font-medium border border-primary bg-indigo-50 text-primary rounded-md">
              หน้า {page} / {totalPages}
            </span>

            {page < totalPages && (
              <Link href={createPageUrl(page + 1)} className="px-3 py-1 text-sm border border-[var(--color-border)] rounded-md hover:bg-gray-50 text-gray-700 transition">
                ถัดไป
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
