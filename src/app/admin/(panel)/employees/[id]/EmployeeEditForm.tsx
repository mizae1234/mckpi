'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, RotateCcw } from 'lucide-react'
import Link from 'next/link'

interface EmployeeData {
  id: string
  employee_code: string
  full_name: string
  position: string
  department: string
  branch: string
  date_of_birth: string
  start_date: string
  status: string
}

export default function EmployeeEditForm({ employee }: { employee: EmployeeData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const data = {
      full_name: formData.get('full_name'),
      position: formData.get('position'),
      department: formData.get('department'),
      branch: formData.get('branch'),
      date_of_birth: formData.get('date_of_birth'),
      start_date: formData.get('start_date'),
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
    if (!confirm('ต้องการรีเซ็ตรหัสผ่านกลับเป็นวันเดือนปีเกิด?')) return
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
          <input className="input-field bg-gray-50" value={employee.employee_code} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชื่อ-นามสกุล *</label>
          <input name="full_name" className="input-field" defaultValue={employee.full_name} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ตำแหน่ง</label>
          <input name="position" className="input-field" defaultValue={employee.position} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">แผนก</label>
          <input name="department" className="input-field" defaultValue={employee.department} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">สาขา</label>
          <input name="branch" className="input-field" defaultValue={employee.branch} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">วันเกิด</label>
          <input name="date_of_birth" type="date" className="input-field" defaultValue={employee.date_of_birth} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">วันเริ่มงาน</label>
          <input name="start_date" type="date" className="input-field" defaultValue={employee.start_date} />
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
