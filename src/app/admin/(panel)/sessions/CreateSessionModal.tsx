'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, CalendarPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CourseOption {
  id: string
  code: string
  title: string
  trainingType: string
}

export default function CreateSessionModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState<'select-course' | 'fill-form'>('select-course')
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formDate, setFormDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formRegEndDate, setFormRegEndDate] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formCapacity, setFormCapacity] = useState('30')
  const [formWaitlist, setFormWaitlist] = useState('0')
  const [formTrainer, setFormTrainer] = useState('')

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch('/api/admin/courses')
        if (res.ok) {
          const data = await res.json()
          setCourses(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCourses(false)
      }
    }
    loadCourses()
  }, [])

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!selectedCourse || !formDate) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/courses/${selectedCourse.id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate: formDate,
          sessionEndDate: formEndDate || null,
          registrationEndDate: formRegEndDate || null,
          location: formLocation,
          capacity: formCapacity,
          waitlistCapacity: formWaitlist,
          trainerName: formTrainer,
        }),
      })

      if (res.ok) {
        router.refresh()
        onClose()
      } else {
        const data = await res.json()
        setError(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ONLINE': return 'badge-info'
      case 'OFFLINE': return 'badge-accent'
      default: return 'badge-primary'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ONLINE': return 'ออนไลน์'
      case 'OFFLINE': return 'ออฟไลน์'
      default: return 'ภายนอก'
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--color-text)]">สร้างรอบอบรมใหม่</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {step === 'select-course' ? 'เลือกคอร์สที่ต้องการเพิ่มรอบ' : `คอร์ส: ${selectedCourse?.title}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {step === 'select-course' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10 py-2.5 text-sm"
                  placeholder="ค้นหาคอร์ส..."
                  autoFocus
                />
              </div>

              {loadingCourses ? (
                <div className="py-8 text-center text-sm text-gray-400 animate-pulse">กำลังโหลดรายการคอร์ส...</div>
              ) : filteredCourses.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">ไม่พบคอร์ส</div>
              ) : (
                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                  {filteredCourses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => { setSelectedCourse(course); setStep('fill-form') }}
                      className="w-full text-left p-3 rounded-xl border border-[var(--color-border)] hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--color-text-secondary)]">{course.code}</span>
                        <span className={`badge ${getTypeBadge(course.trainingType)} text-[10px]`}>
                          {getTypeLabel(course.trainingType)}
                        </span>
                      </div>
                      <div className="font-medium text-sm text-[var(--color-text)] mt-0.5 group-hover:text-primary transition-colors">
                        {course.title}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Selected course chip */}
              <button
                onClick={() => setStep('select-course')}
                className="text-xs text-primary hover:underline"
              >
                ← เปลี่ยนคอร์ส
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">📅 วันที่เริ่ม *</label>
                  <input type="datetime-local" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="input-field py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">📅 วันที่สิ้นสุด</label>
                  <input type="datetime-local" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} className="input-field py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">🔒 ปิดรับลงทะเบียน</label>
                  <input type="datetime-local" value={formRegEndDate} onChange={(e) => setFormRegEndDate(e.target.value)} className="input-field py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">📍 สถานที่</label>
                  <input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="input-field py-2 text-sm" placeholder="เช่น ห้องประชุม A" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">👥 จำนวนที่รับ (คน)</label>
                  <input type="number" min="1" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} className="input-field py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">🔄 สำรอง (คน)</label>
                  <input type="number" min="0" value={formWaitlist} onChange={(e) => setFormWaitlist(e.target.value)} className="input-field py-2 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">🎤 วิทยากร (ไม่บังคับ)</label>
                  <input value={formTrainer} onChange={(e) => setFormTrainer(e.target.value)} className="input-field py-2 text-sm" placeholder="ชื่อวิทยากร" />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'fill-form' && (
          <div className="p-5 border-t border-[var(--color-border)] flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary text-sm px-4">ยกเลิก</button>
            <button onClick={handleSubmit} disabled={loading || !formDate} className="btn-primary text-sm px-6">
              {loading ? 'กำลังบันทึก...' : 'สร้างรอบอบรม'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
