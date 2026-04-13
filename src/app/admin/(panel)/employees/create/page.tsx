'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function CreateEmployeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      employee_code: formData.get('employee_code'),
      full_name: formData.get('full_name'),
      position: formData.get('position'),
      department: formData.get('department'),
      branch: formData.get('branch'),
      date_of_birth: formData.get('date_of_birth'),
      start_date: formData.get('start_date'),
    }

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        setError(result.error || 'เกิดข้อผิดพลาด')
        return
      }

      router.push('/admin/employees')
      router.refresh()
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/employees" className="btn-secondary py-2 px-3">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">เพิ่มพนักงาน</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">สร้างบัญชีพนักงานใหม่ในระบบ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="stat-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">รหัสพนักงาน *</label>
            <input name="employee_code" className="input-field" placeholder="เช่น E00006" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชื่อ-นามสกุล *</label>
            <input name="full_name" className="input-field" placeholder="เช่น สมชาย ใจดี" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ตำแหน่ง</label>
            <input name="position" className="input-field" placeholder="เช่น พนักงาน" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">แผนก</label>
            <input name="department" className="input-field" placeholder="เช่น ฝ่ายปฏิบัติการ" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">สาขา</label>
            <input name="branch" className="input-field" placeholder="เช่น สำนักงานใหญ่" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">วันเกิด *</label>
            <input name="date_of_birth" type="date" className="input-field" required />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">ใช้เป็นรหัสผ่านเริ่มต้น (ddmmyyyy)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">วันเริ่มงาน</label>
            <input name="start_date" type="date" className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/employees" className="btn-secondary">ยกเลิก</Link>
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
    </div>
  )
}
