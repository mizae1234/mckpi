'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Target, Search } from 'lucide-react'

interface KpiOption {
  id: string
  code: string
  name: string
  year: number
}

export default function CreateCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // KPI state
  const [kpiOptions, setKpiOptions] = useState<KpiOption[]>([])
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>([])
  const [kpiSearch, setKpiSearch] = useState('')
  const [isMandatory, setIsMandatory] = useState(false)
  const [onboardingDeadlineDays, setOnboardingDeadlineDays] = useState<number | string>(14)

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    fetch(`/api/admin/kpis?year=${currentYear}`)
      .then(res => res.json())
      .then(data => setKpiOptions(data))
      .catch(() => {})
  }, [])

  const toggleKpi = (id: string) => {
    setSelectedKpiIds(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    )
  }

  const filteredKpis = useMemo(() => {
    if (!kpiSearch.trim()) return kpiOptions
    const q = kpiSearch.toLowerCase()
    return kpiOptions.filter(kpi =>
      kpi.name.toLowerCase().includes(q) || kpi.code.toLowerCase().includes(q)
    )
  }, [kpiOptions, kpiSearch])

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
      creditHours: Number(formData.get('creditHours')),
      isMandatory,
      onboardingDeadlineDays: isMandatory ? (onboardingDeadlineDays === '' ? 0 : Number(onboardingDeadlineDays)) : 0,
      status: formData.get('status'),
      kpiIds: selectedKpiIds,
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
              <option value="OFFLINE">Classroom (ตามรอบ / ไลฟ์)</option>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชั่วโมงอบรม</label>
            <input name="creditHours" type="number" step="0.5" className="input-field" defaultValue={0} min={0} onFocus={(e) => e.target.select()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">คะแนนผ่าน (%)</label>
            <input name="passScore" type="number" className="input-field" defaultValue={80} min={0} max={100} onFocus={(e) => e.target.select()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">บังคับเรียน</label>
            <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors h-[42px]">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={e => setIsMandatory(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)]">บังคับ</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">สถานะ</label>
            <select name="status" className="input-field">
              <option value="DRAFT">ฉบับร่าง</option>
              <option value="PUBLISHED">เผยแพร่</option>
            </select>
          </div>
        </div>

        {/* Onboarding Deadline - แสดงเมื่อ isMandatory */}
        {isMandatory && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
            <label className="block text-sm font-semibold text-amber-800 mb-1">
              ⏰ กำหนดอบรมหลังเริ่มงาน
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={365}
                value={onboardingDeadlineDays}
                onChange={e => setOnboardingDeadlineDays(e.target.value === '' ? '' : Number(e.target.value))}
                onFocus={e => e.target.select()}
                className="input-field w-24 py-2"
              />
              <span className="text-sm text-amber-700">วัน — พนักงานใหม่ต้องอบรมให้เสร็จภายใน <strong>{onboardingDeadlineDays} วัน</strong> หลังเริ่มงาน</span>
            </div>
            <p className="text-xs text-amber-600 mt-1.5">ใช้ในรายงาน KPI พนักงานใหม่ (Onboarding KPI Report)</p>
          </div>
        )}

        {/* KPI Picker */}
        {kpiOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              <Target className="w-4 h-4 inline-block mr-1 -mt-0.5" />
              เชื่อมโยง KPI (ปี {new Date().getFullYear()})
              {selectedKpiIds.length > 0 && (
                <span className="text-xs text-[var(--color-primary)] ml-2">เลือกแล้ว {selectedKpiIds.length} รายการ</span>
              )}
            </label>
            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  value={kpiSearch}
                  onChange={(e) => setKpiSearch(e.target.value)}
                  placeholder="ค้นหา KPI ด้วยชื่อหรือรหัส..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm border-b border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:bg-white placeholder:text-[var(--color-text-secondary)]/50"
                />
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto p-2.5">
                {filteredKpis.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-secondary)] text-center py-3">ไม่พบ KPI ที่ค้นหา</p>
                ) : (
                  filteredKpis.map(kpi => (
                    <label
                      key={kpi.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                        selectedKpiIds.includes(kpi.id)
                          ? 'bg-primary/5 border border-primary/30'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedKpiIds.includes(kpi.id)}
                        onChange={() => toggleKpi(kpi.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-[var(--color-text)]">{kpi.name}</span>
                        <span className="text-xs text-[var(--color-text-secondary)] ml-2">{kpi.code}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

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
