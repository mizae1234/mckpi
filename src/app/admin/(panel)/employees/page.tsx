import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, Users } from 'lucide-react'
import ImportEmployeeButton from './ImportEmployeeButton'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; departmentCode?: string; branchCode?: string }>
}) {
  // ... (keep search logic unchanged)
  const params = await searchParams
  const q = params.q || ''
  const departmentCode = params.departmentCode || ''
  const branchCode = params.branchCode || ''

  const where: Record<string, unknown> = {}
  if (q) {
    where.OR = [
      { employeeCode: { contains: q, mode: 'insensitive' } },
      { fullName: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (departmentCode) where.departmentCode = departmentCode
  if (branchCode) where.branchCode = branchCode

  const employees = await prisma.employee.findMany({
    where,
    orderBy: { employeeCode: 'asc' },
    include: { branch: true },
  })

  // Get unique departments and branches for filters
  const allEmployees = await prisma.employee.findMany({
    select: { departmentCode: true },
    distinct: ['departmentCode'],
  })
  const departments = [...new Set(allEmployees.map(e => e.departmentCode).filter((d): d is string => Boolean(d)))]
  
  const allBranches = await prisma.branch.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">จัดการพนักงาน</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">รายการพนักงานทั้งหมดในระบบ</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportEmployeeButton />
          <Link href="/admin/employees/create" className="btn-primary">
            <Plus className="w-5 h-5" />
            เพิ่มพนักงาน
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form className="stat-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="q"
              defaultValue={q}
              className="input-field pl-10 py-2 text-sm"
              placeholder="ค้นหารหัส หรือชื่อพนักงาน..."
            />
          </div>
          <select name="departmentCode" defaultValue={departmentCode} className="input-field py-2 text-sm w-auto min-w-[150px]">
            <option value="">ทุกแผนก</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select name="branchCode" defaultValue={branchCode} className="input-field py-2 text-sm w-auto min-w-[150px]">
            <option value="">ทุกสาขา</option>
            {allBranches.map(b => <option key={b.code} value={b.code}>{b.name} ({b.code})</option>)}
          </select>
          <button type="submit" className="btn-primary py-2 px-4 text-sm">
            <Search className="w-4 h-4" />
            ค้นหา
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อ-สกุล</th>
              <th>ตำแหน่ง</th>
              <th>แผนก</th>
              <th>สาขา</th>
              <th>วันเริ่มงาน</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-[var(--color-text-secondary)]">ไม่พบข้อมูลพนักงาน</p>
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="font-mono font-semibold text-primary">{emp.employeeCode}</td>
                  <td className="font-medium">{emp.fullName}</td>
                  <td>{emp.positionCode || '-'}</td>
                  <td>{emp.departmentCode || '-'}</td>
                  <td>{emp.branch?.name || '-'}</td>
                  <td>{emp.startDate.toLocaleDateString('th-TH')}</td>
                  <td>
                    <span className={`badge ${emp.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.status === 'ACTIVE' ? 'ใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/employees/${emp.id}`} className="text-sm text-primary hover:underline">
                      แก้ไข
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
