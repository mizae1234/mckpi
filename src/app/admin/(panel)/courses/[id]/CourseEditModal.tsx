'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Target, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface KpiOption {
  id: string
  code: string
  name: string
  year: number
}

interface CourseEditModalProps {
  course: {
    id: string
    title: string
    description: string
    passScore: number
    creditHours?: number
    isMandatory: boolean
    onboardingDeadlineDays?: number
    trainingType: string
    kpiIds?: string[]
  }
  onClose: () => void
}

export default function CourseEditModal({ course, onClose }: CourseEditModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description || '')
  const [passScore, setPassScore] = useState<number | string>(course.passScore)
  const [creditHours, setCreditHours] = useState<number | string>(course.creditHours || 0)
  const [isMandatory, setIsMandatory] = useState(course.isMandatory)
  const [onboardingDeadlineDays, setOnboardingDeadlineDays] = useState<number | string>(course.onboardingDeadlineDays ?? 14)
  const [trainingType, setTrainingType] = useState(course.trainingType)
  const [loading, setLoading] = useState(false)

  // KPI state
  const [kpiOptions, setKpiOptions] = useState<KpiOption[]>([])
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>(course.kpiIds || [])
  const [kpiSearch, setKpiSearch] = useState('')

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

  const handleSave = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          passScore: Number(passScore) || 0, 
          creditHours: Number(creditHours) || 0, 
          isMandatory, 
          onboardingDeadlineDays: isMandatory ? (onboardingDeadlineDays === '' ? 0 : Number(onboardingDeadlineDays)) : 0,
          trainingType, 
          kpiIds: selectedKpiIds 
        }),
      })

      if (res.ok) {
        router.refresh()
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'บันทึกไม่สำเร็จ')
      }
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-lg text-[var(--color-text)]">แก้ไขรายละเอียดคอร์ส</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชื่อคอร์ส</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field py-2.5"
              placeholder="ชื่อหลักสูตร"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">คำอธิบาย</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input-field py-2.5 resize-none"
              placeholder="อธิบายเนื้อหาและวัตถุประสงค์ของคอร์ส"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ประเภท</label>
              <select
                value={trainingType}
                onChange={(e) => setTrainingType(e.target.value)}
                className="input-field py-2.5"
              >
                <option value="ONLINE">ออนไลน์</option>
                <option value="OFFLINE">Classroom (ตามรอบ / ไลฟ์)</option>
                <option value="EXTERNAL">ภายนอก</option>
              </select>
            </div>
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชั่วโมงอบรม</label>
              <input
                type="number"
                step="0.5"
                min={0}
                value={creditHours}
                onChange={(e) => setCreditHours(e.target.value === '' ? '' : Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                className="input-field py-2.5"
              />
            </div>
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">คะแนนผ่าน (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={passScore}
                onChange={(e) => setPassScore(e.target.value === '' ? '' : Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                className="input-field py-2.5"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <div>
              <div className="text-sm font-medium text-[var(--color-text)]">หลักสูตรบังคับ</div>
              <div className="text-xs text-[var(--color-text-secondary)]">พนักงานทุกคนต้องเรียนหลักสูตรนี้</div>
            </div>
          </label>

          {/* Onboarding Deadline (แสดงเมื่อเป็นหลักสูตรบังคับ) */}
          {isMandatory && (
            <div className="ml-0 p-3 rounded-xl border border-amber-200 bg-amber-50/50">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">กำหนดอบรมหลังเริ่มงาน (วัน)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={onboardingDeadlineDays}
                  onChange={(e) => setOnboardingDeadlineDays(e.target.value === '' ? '' : Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="input-field py-2 w-24"
                />
                <span className="text-xs text-[var(--color-text-secondary)]">วัน (ใช้ในรายงาน KPI พนักงานใหม่)</span>
              </div>
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
                <div className="space-y-1 max-h-40 overflow-y-auto p-2.5">
                  {filteredKpis.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)] text-center py-3">ไม่พบ KPI ที่ค้นหา</p>
                  ) : (
                    filteredKpis.map(kpi => (
                      <label
                        key={kpi.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
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
                        <span className="text-sm text-[var(--color-text)]">{kpi.name}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">{kpi.code}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="btn-secondary px-5">ยกเลิก</button>
          <button onClick={handleSave} disabled={loading || !title.trim()} className="btn-primary px-5 flex items-center gap-2">
            <Save className="w-4 h-4" />
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
