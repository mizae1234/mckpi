'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function CreateCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      code: formData.get('code'),
      title: formData.get('title'),
      description: formData.get('description'),
      trainingType: formData.get('trainingType'),
      passScore: Number(formData.get('passScore')),
      isMandatory: formData.get('isMandatory') === 'true',
      status: formData.get('status'),
    }

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        setError(result.error || 'เกิดข้อผิดพลาด')
        return
      }

      const createdCourse = await res.json()
      router.push(`/admin/courses/${createdCourse.id}`)
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
        <Link href="/admin/courses" className="btn-secondary py-2 px-3">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">สร้างคอร์สใหม่</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">สร้างหลักสูตรอบรมใหม่</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="stat-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">รหัสคอร์ส *</label>
            <input name="code" className="input-field" placeholder="เช่น CRS-004" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ประเภท *</label>
            <select name="trainingType" className="input-field" required>
              <option value="ONLINE">Online (วิดีโอ + ข้อสอบ)</option>
              <option value="OFFLINE">Offline (ห้องเรียน)</option>
              <option value="EXTERNAL">External (นำเข้าจากภายนอก)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชื่อคอร์ส *</label>
          <input name="title" className="input-field" placeholder="เช่น ความปลอดภัยในการทำงาน" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">คำอธิบาย</label>
          <textarea name="description" className="input-field" rows={3} placeholder="รายละเอียดหลักสูตร..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">คะแนนผ่าน (%)</label>
            <input name="passScore" type="number" className="input-field" defaultValue={80} min={0} max={100} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">บังคับเรียน</label>
            <select name="isMandatory" className="input-field">
              <option value="false">ไม่บังคับ</option>
              <option value="true">บังคับ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">สถานะ</label>
            <select name="status" className="input-field">
              <option value="DRAFT">ฉบับร่าง</option>
              <option value="PUBLISHED">เผยแพร่</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/courses" className="btn-secondary">ยกเลิก</Link>
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
