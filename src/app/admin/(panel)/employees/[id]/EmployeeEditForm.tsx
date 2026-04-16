'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useModal } from '@/components/ModalProvider'

interface EmployeeData {
  id: string
  employeeCode: string
  fullName: string
  positionCode: string
  departmentCode: string
  branchCode: string | null
  dateOfBirth: string
  startDate: string
  status: string
}

export default function EmployeeEditForm({ employee, branches = [] }: { employee: EmployeeData, branches?: { code: string; name: string }[] }) {
  const router = useRouter()
  const { showConfirm } = useModal()
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [branchValue, setBranchValue] = useState(employee.branchCode || '')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const data = {
      fullName: formData.get('fullName'),
      positionCode: formData.get('position'),
      departmentCode: formData.get('department'),
      branchCode: formData.get('branchCode'),
      dateOfBirth: formData.get('dateOfBirth'),
      startDate: formData.get('startDate'),
      status: formData.get('status'),
    }

    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        setError(result.error || 'เกิดข้อผิดพลาด')
        return
      }

      setMessage('บันทึกสำเร็จ!')
      router.refresh()
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    const ok = await showConfirm({ title: 'รีเซ็ตรหัสผ่าน', message: 'ต้องการรีเซ็ตรหัสผ่านกลับเป็นวันเดือนปีเกิด?', type: 'warning', confirmText: 'รีเซ็ต' })
    if (!ok) return
    setResetLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/employees/${employee.id}/reset-password`, {
        method: 'POST',
      })
      if (res.ok) {
        setMessage('รีเซ็ตรหัสผ่านสำเร็จ!')
      } else {
        setError('รีเซ็ตรหัสผ่านไม่สำเร็จ')
      }
    } catch {
      setError('เกิดข้อผิดพลาด')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stat-card p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">รหัสพนักงาน</label>
          <input className="input-field bg-gray-50" value={employee.employeeCode} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชื่อ-นามสกุล *</label>
          <input name="fullName" className="input-field" defaultValue={employee.fullName} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ตำแหน่ง</label>
          <input name="position" className="input-field" defaultValue={employee.positionCode} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">แผนก</label>
          <input name="department" className="input-field" defaultValue={employee.departmentCode} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">สาขา</label>
          <select 
            name="branchCode" 
            className="input-field" 
            value={branchValue}
            onChange={(e) => setBranchValue(e.target.value)}
          >
            <option value="">- ระบุสาขา -</option>
            {branches.map(b => (
              <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">วันเกิด</label>
          <input name="dateOfBirth" type="date" className="input-field" defaultValue={employee.dateOfBirth} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">วันเริ่มงาน</label>
          <input name="startDate" type="date" className="input-field" defaultValue={employee.startDate} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">สถานะ</label>
          <select name="status" className="input-field" defaultValue={employee.status}>
            <option value="ACTIVE">ใช้งาน</option>
            <option value="INACTIVE">ปิดใช้งาน</option>
          </select>
        </div>
      </div>

      {/* Reset Password */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <button
          type="button"
          onClick={handleResetPassword}
          disabled={resetLoading}
          className="btn-secondary text-sm py-2"
        >
          {resetLoading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          รีเซ็ตรหัสผ่าน (กลับเป็นวันเกิด)
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>}
      {message && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-100">{message}</div>}

      <div className="flex justify-end gap-3 pt-2">
        <Link href="/admin/employees" className="btn-secondary">กลับ</Link>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              บันทึก
            </>
          )}
        </button>
      </div>
    </form>
  )
}
