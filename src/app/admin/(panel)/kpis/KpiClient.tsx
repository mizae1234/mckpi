'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Target, Plus, Copy, Edit2, Trash2, X, Save, BookOpen, ChevronRight } from 'lucide-react'
import { useModal } from '@/components/ModalProvider'

interface CourseRef {
  id: string
  code: string
  title: string
  trainingType: string
}

interface KpiData {
  id: string
  code: string
  name: string
  target: string
  year: number
  courses: { id: string; course: CourseRef }[]
}

interface KpiClientProps {
  initialKpis: KpiData[]
  availableYears: number[]
}

export default function KpiClient({ initialKpis, availableYears }: KpiClientProps) {
  const router = useRouter()
  const { showAlert, showConfirm } = useModal()
  const currentYear = new Date().getFullYear()

  const [kpis, setKpis] = useState<KpiData[]>(initialKpis)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [years, setYears] = useState(availableYears)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [editingKpi, setEditingKpi] = useState<KpiData | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formTarget, setFormTarget] = useState('')
  const [loading, setLoading] = useState(false)

  // Copy state
  const [copyFromYear, setCopyFromYear] = useState<number | ''>('')
  const [copyToYear, setCopyToYear] = useState<number | ''>(currentYear)

  const filteredKpis = kpis.filter(k => k.year === selectedYear)

  const resetForm = () => {
    setFormName('')
    setFormTarget('')
    setEditingKpi(null)
  }

  const handleAdd = async () => {
    if (!formName.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, target: formTarget, year: selectedYear }),
      })
      if (!res.ok) {
        const data = await res.json()
        showAlert({ message: data.error || 'เกิดข้อผิดพลาด', type: 'danger' })
        return
      }
      const newKpi = await res.json()
      setKpis([...kpis, newKpi])
      setShowAddModal(false)
      resetForm()
      router.refresh()
    } catch {
      showAlert({ message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingKpi || !formName.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/kpis/${editingKpi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, target: formTarget }),
      })
      if (!res.ok) {
        const data = await res.json()
        showAlert({ message: data.error || 'เกิดข้อผิดพลาด', type: 'danger' })
        return
      }
      const updated = await res.json()
      setKpis(kpis.map(k => k.id === updated.id ? updated : k))
      setEditingKpi(null)
      resetForm()
      router.refresh()
    } catch {
      showAlert({ message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (kpi: KpiData) => {
    const ok = await showConfirm({
      title: 'ลบ KPI',
      message: `ยืนยันลบ "${kpi.name}" ?\nCourse ที่ map อยู่จะถูกยกเลิก mapping`,
      type: 'danger',
      confirmText: 'ลบ',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/kpis/${kpi.id}`, { method: 'DELETE' })
      if (res.ok) {
        setKpis(kpis.filter(k => k.id !== kpi.id))
        router.refresh()
      }
    } catch {
      showAlert({ message: 'ลบไม่สำเร็จ', type: 'danger' })
    }
  }

  const handleCopy = async () => {
    if (!copyFromYear || !copyToYear || copyFromYear === copyToYear) {
      showAlert({ message: 'กรุณาเลือกปีต้นทางและปีปลายทางที่ไม่ซ้ำกัน', type: 'warning' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/kpis/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromYear: copyFromYear, toYear: copyToYear }),
      })
      if (!res.ok) {
        const data = await res.json()
        showAlert({ message: data.error || 'เกิดข้อผิดพลาด', type: 'danger' })
        return
      }
      const data = await res.json()
      showAlert({ message: `คัดลอก ${data.created} KPI ไปปี ${copyToYear} สำเร็จ`, type: 'success' })
      setShowCopyModal(false)
      setCopyFromYear('')
      // Add new year to list if needed
      if (!years.includes(Number(copyToYear))) {
        setYears([Number(copyToYear), ...years].sort((a, b) => b - a))
      }
      setSelectedYear(Number(copyToYear))
      router.refresh()
      // Reload KPIs
      const res2 = await fetch('/api/admin/kpis')
      if (res2.ok) setKpis(await res2.json())
    } catch {
      showAlert({ message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (kpi: KpiData) => {
    setEditingKpi(kpi)
    setFormName(kpi.name)
    setFormTarget(kpi.target)
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ONLINE': return 'badge-info'
      case 'OFFLINE': return 'badge-accent'
      default: return 'badge-primary'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">จัดการ KPI</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">กำหนด KPI รายปี และเชื่อมโยงกับคอร์สอบรม</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCopyModal(true)} className="btn-secondary">
            <Copy className="w-4 h-4" /> Copy จากปีอื่น
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true) }} className="btn-primary">
            <Plus className="w-5 h-5" /> เพิ่ม KPI
          </button>
        </div>
      </div>

      {/* Year Tabs */}
      <div className="flex gap-2 flex-wrap">
        {years.map(y => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedYear === y
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/50'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* KPI List */}
      {filteredKpis.length === 0 ? (
        <div className="stat-card p-12 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)] font-medium">ไม่มี KPI สำหรับปี {selectedYear}</p>
          <p className="text-sm text-gray-400 mt-1">กดปุ่ม "เพิ่ม KPI" หรือ "Copy จากปีอื่น"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKpis.map(kpi => (
            <div key={kpi.id} className="stat-card p-5 group">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 text-primary flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingKpi?.id === kpi.id ? (
                    /* Inline Edit */
                    <div className="space-y-3">
                      <input
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="input-field py-2 text-sm"
                        placeholder="ชื่อ KPI"
                        autoFocus
                      />
                      <input
                        value={formTarget}
                        onChange={e => setFormTarget(e.target.value)}
                        className="input-field py-2 text-sm"
                        placeholder="เป้าหมาย"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleEdit} disabled={loading} className="btn-primary py-1.5 px-3 text-sm">
                          <Save className="w-3.5 h-3.5" /> {loading ? 'บันทึก...' : 'บันทึก'}
                        </button>
                        <button onClick={() => { setEditingKpi(null); resetForm() }} className="btn-secondary py-1.5 px-3 text-sm">
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display */
                    <>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-[var(--color-text-secondary)]">{kpi.code}</span>
                      </div>
                      <h3 className="font-semibold text-[var(--color-text)]">{kpi.name}</h3>
                      {kpi.target && (
                        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                          🎯 {kpi.target}
                        </p>
                      )}
                      {/* Mapped Courses */}
                      {kpi.courses.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {kpi.courses.map(kc => (
                            <span key={kc.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                              <BookOpen className="w-3 h-3" />
                              {kc.course.code} — {kc.course.title}
                            </span>
                          ))}
                        </div>
                      )}
                      {kpi.courses.length === 0 && (
                        <p className="text-xs text-gray-400 mt-2">ยังไม่มีคอร์สที่เชื่อมโยง</p>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                {editingKpi?.id !== kpi.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(kpi)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="แก้ไข">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(kpi)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="ลบ">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add KPI Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-lg text-[var(--color-text)]">เพิ่ม KPI ปี {selectedYear}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชื่อ KPI *</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="input-field py-2.5"
                  placeholder="เช่น ความปลอดภัยในการทำงาน"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">เป้าหมาย</label>
                <input
                  value={formTarget}
                  onChange={e => setFormTarget(e.target.value)}
                  className="input-field py-2.5"
                  placeholder="เช่น พนักงานผ่านอบรม 100%"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary px-4">ยกเลิก</button>
              <button onClick={handleAdd} disabled={loading || !formName.trim()} className="btn-primary px-5">
                {loading ? 'กำลังบันทึก...' : 'เพิ่ม KPI'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Copy KPI Modal */}
      {showCopyModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowCopyModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-lg text-[var(--color-text)]">คัดลอก KPI ข้ามปี</h3>
              <button onClick={() => setShowCopyModal(false)} className="p-1.5 rounded-lg hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                คัดลอก KPI ทั้งหมดจากปีต้นทางไปยังปีปลายทาง (ไม่รวม Course ที่เชื่อมโยง)
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">จากปี *</label>
                  <select
                    value={copyFromYear}
                    onChange={e => setCopyFromYear(Number(e.target.value))}
                    className="input-field py-2.5"
                  >
                    <option value="">เลือกปี</option>
                    {years.filter(y => kpis.some(k => k.year === y)).map(y => (
                      <option key={y} value={y}>{y} ({kpis.filter(k => k.year === y).length} KPI)</option>
                    ))}
                  </select>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-6" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ไปปี *</label>
                  <input
                    type="number"
                    value={copyToYear}
                    onChange={e => setCopyToYear(Number(e.target.value))}
                    className="input-field py-2.5"
                    min={2020}
                    max={2100}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => setShowCopyModal(false)} className="btn-secondary px-4">ยกเลิก</button>
              <button onClick={handleCopy} disabled={loading || !copyFromYear || !copyToYear} className="btn-primary px-5">
                <Copy className="w-4 h-4" />
                {loading ? 'กำลังคัดลอก...' : 'คัดลอก'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
