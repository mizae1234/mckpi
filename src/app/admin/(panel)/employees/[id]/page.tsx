import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EmployeeEditForm from './EmployeeEditForm'

export const dynamic = 'force-dynamic'

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const employee = await prisma.employee.findUnique({ where: { id } })
  if (!employee) return notFound()

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/employees" className="btn-secondary py-2 px-3">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">แก้ไขพนักงาน</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{employee.employee_code} — {employee.full_name}</p>
        </div>
      </div>

      <EmployeeEditForm employee={{
        id: employee.id,
        employee_code: employee.employee_code,
        full_name: employee.full_name,
        position: employee.position,
        department: employee.department,
        branch: employee.branch,
        date_of_birth: employee.date_of_birth.toISOString().split('T')[0],
        start_date: employee.start_date.toISOString().split('T')[0],
        status: employee.status,
      }} />
    </div>
  )
}
