'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Save, Trash2, Edit2, X, Library, FolderOpen,
  AlertCircle, FileQuestion, ChevronRight
} from 'lucide-react'
import { useModal } from '@/components/ModalProvider'

interface QuestionSetData {
  id: string
  name: string
  description: string
  createdAt: string
  _count: { questions: number }
}

export default function QuestionBankPage() {
  const router = useRouter()
  const { showAlert, showConfirm } = useModal()
  const [sets, setSets] = useState<QuestionSetData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form State
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const fetchSets = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/question-bank')
      if (res.ok) {
        const data = await res.json()
        setSets(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSets() }, [fetchSets])

  const resetForm = () => {
    setEditId(null)
    setName('')
    setDescription('')
    setShowForm(false)
  }

  const handleEditClick = (set: QuestionSetData) => {
    setEditId(set.id)
    setName(set.name)
    setDescription(set.description)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { showAlert({ message: 'กรุณาระบุชื่อชุดคำถาม', type: 'warning' }); return }

    setSaving(true)
    try {
      const url = editId ? `/api/admin/question-bank/${editId}` : '/api/admin/question-bank'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'บันทึกไม่สำเร็จ')
      }

      resetForm()
      fetchSets()
    } catch (err) {
      console.error(err)
      showAlert({ message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', type: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, questionCount: number) => {
    const msg = questionCount > 0
      ? `ชุดคำถามนี้มี ${questionCount} คำถาม หากลบชุดจะลบคำถามทั้งหมดด้วย\n\nยืนยันลบ?`
      : 'ยืนยันลบชุดคำถามนี้?'
    const ok = await showConfirm({ title: 'ลบชุดคำถาม', message: msg, type: 'danger', confirmText: 'ลบ' })
    if (!ok) return

    try {
      const res = await fetch(`/api/admin/question-bank/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      setSets(sets.filter(s => s.id !== id))
    } catch (err) {
      console.error(err)
      showAlert({ message: 'ลบไม่สำเร็จ', type: 'danger' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">คลังคำถาม</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">จัดการชุดคำถามส่วนกลาง สำหรับนำไปใช้ในคอร์สต่าง ๆ</p>
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
            <Plus className="w-5 h-5" /> สร้างชุดคำถาม
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="stat-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="font-bold text-[var(--color-text)]">
                {editId ? 'แก้ไขชุดคำถาม' : 'สร้างชุดคำถามใหม่'}
              </h2>
              <button type="button" onClick={resetForm} className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ชื่อชุดคำถาม *</label>
              <input
                className="input-field w-full"
                placeholder="เช่น ความปลอดภัยในการทำงาน, HR Onboarding"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">คำอธิบาย (ถ้ามี)</label>
              <textarea
                className="input-field w-full min-h-[60px]"
                placeholder="อธิบายรายละเอียดของชุดคำถามนี้..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
              <button type="button" onClick={resetForm} className="btn-secondary">ยกเลิก</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'กำลังบันทึก...' : <><Save className="w-4 h-4" /> บันทึก</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sets List */}
      {sets.length === 0 ? (
        <div className="stat-card p-12 text-center">
          <Library className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] font-medium text-lg">ยังไม่มีชุดคำถาม</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">สร้างชุดคำถามแรกเพื่อเริ่มต้นจัดการคลังข้อสอบ</p>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary mt-5 inline-flex">
            <Plus className="w-5 h-5" /> สร้างชุดคำถามแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set) => (
            <div
              key={set.id}
              className="stat-card p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group relative"
              onClick={() => router.push(`/admin/question-bank/${set.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-primary flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--color-text)] group-hover:text-primary transition-colors truncate">
                    {set.name}
                  </h3>
                  {set.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{set.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="badge badge-info text-[10px] flex items-center gap-1">
                      <FileQuestion className="w-3 h-3" /> {set._count.questions} คำถาม
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">
                      สร้างเมื่อ {new Date(set.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditClick(set); }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="แก้ไขชื่อชุด"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(set.id, set._count.questions); }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="ลบชุดคำถาม"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
