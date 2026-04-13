import { prisma } from '@/lib/prisma'
import { BarChart3, FileSpreadsheet } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ResultsPage() {
  const results = await prisma.trainingResult.findMany({
    include: {
      employee: { select: { employee_code: true, full_name: true, department: true } },
      course: { select: { code: true, title: true, training_type: true } },
    },
    orderBy: { created_at: 'desc' },
  })

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

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'ONLINE': return { label: 'Online', class: 'badge-info' }
      case 'OFFLINE': return { label: 'Offline', class: 'badge-accent' }
      case 'EXTERNAL': return { label: 'External', class: 'badge-primary' }
      default: return { label: source, class: 'badge-gray' }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">ผลลัพธ์การอบรม</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">ผลรวมจากทุกช่องทาง (Online / Offline / External)</p>
        </div>
        <button className="btn-accent">
          <FileSpreadsheet className="w-5 h-5" />
          Import Excel
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>พนักงาน</th>
              <th>คอร์ส</th>
              <th>แหล่งที่มา</th>
              <th>คะแนน</th>
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
                const sourceInfo = getSourceLabel(r.source)
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium">{r.employee.full_name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{r.employee.employee_code}</div>
                    </td>
                    <td>
                      <div className="font-medium">{r.course.title}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{r.course.code}</div>
                    </td>
                    <td>
                      <span className={`badge ${sourceInfo.class}`}>{sourceInfo.label}</span>
                    </td>
                    <td className="font-semibold">{r.score != null ? `${r.score}%` : '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(r.status)}`}>{getStatusLabel(r.status)}</span>
                    </td>
                    <td>{r.completed_at ? new Date(r.completed_at).toLocaleDateString('th-TH') : '-'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
