'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Plus, Save, Trash2, Edit2, CheckCircle2,
  AlertCircle, X, ArrowLeft, Library, FileQuestion
} from 'lucide-react'
import { useModal } from '@/components/ModalProvider'

interface MasterQuestionData {
  id: string
  questionText: string
  options: string[]
  correctAnswer: number
  orderNum: number
}

interface SetInfo {
  id: string
  name: string
  description: string
}

export default function QuestionSetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const setId = params.id as string
  const { showAlert, showConfirm } = useModal()

  const [setInfo, setSetInfo] = useState<SetInfo | null>(null)
  const [questions, setQuestions] = useState<MasterQuestionData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form State
  const [editId, setEditId] = useState<string | null>(null)
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState<number>(0)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/question-bank/${setId}`)
      if (!res.ok) {
        router.push('/admin/question-bank')
        return
      }
      const data = await res.json()
      setSetInfo({ id: data.id, name: data.name, description: data.description })
      setQuestions(data.questions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [setId, router])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => {
    setEditId(null)
    setQuestionText('')
    setOptions(['', '', '', ''])
    setCorrectAnswer(0)
    setShowForm(false)
  }

  const handleEditClick = (q: MasterQuestionData) => {
    setEditId(q.id)
    setQuestionText(q.questionText)
    setOptions([...q.options])
    setCorrectAnswer(q.correctAnswer)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddOption = () => setOptions([...options, ''])
  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) { showAlert({ message: 'ต้องมีอย่างน้อย 2 ตัวเลือก', type: 'warning' }); return }
    const newOptions = options.filter((_, i) => i !== index)
    if (correctAnswer === index) setCorrectAnswer(0)
    else if (correctAnswer > index) setCorrectAnswer(correctAnswer - 1)
    setOptions(newOptions)
  }
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionText.trim()) { showAlert({ message: 'กรุณากรอกคำถาม', type: 'warning' }); return }
    if (options.some(opt => !opt.trim())) { showAlert({ message: 'กรุณากรอกตัวเลือกให้ครบทุกข้อ', type: 'warning' }); return }

    setSaving(true)
    try {
      const url = editId
        ? `/api/admin/question-bank/${setId}/questions/${editId}`
        : `/api/admin/question-bank/${setId}/questions`
      const method = editId ? 'PUT' : 'POST'
      const payload = { questionText, options, correctAnswer }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'บันทึกไม่สำเร็จ')
      }

      resetForm()
      fetchData()
    } catch (err) {
      console.error(err)
      showAlert({ message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', type: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await showConfirm({ title: 'ลบคำถาม', message: 'ยืนยันลบคำถามนี้จากคลัง?\n(คำถามที่ถูก copy ไปใช้ในคอร์สแล้วจะไม่ได้รับผลกระทบ)', type: 'danger', confirmText: 'ลบ' })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/question-bank/${setId}/questions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      setQuestions(questions.filter(q => q.id !== id))
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

  if (!setInfo) return null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push('/admin/question-bank')} className="btn-secondary py-2 px-3 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-info text-[10px] flex items-center gap-1">
              <Library className="w-3 h-3" /> คลังคำถาม
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{setInfo.name}</h1>
          {setInfo.description && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{setInfo.description}</p>
          )}
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
            <Plus className="w-5 h-5" /> เพิ่มคำถาม
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="stat-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="font-bold text-[var(--color-text)]">
                {editId ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}
              </h2>
              <button type="button" onClick={resetForm} className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">คำถาม *</label>
              <textarea
                className="input-field w-full min-h-[80px]"
                placeholder="พิมพ์คำถามของคุณที่นี่..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium">ตัวเลือก (คลิก ⚪ เพื่อเลือกเป็นข้อที่ถูกต้อง)</label>
              </div>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectAnswer(idx)}
                      className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${correctAnswer === idx ? 'text-green-600 bg-green-100' : 'text-gray-300 hover:bg-gray-100'}`}
                    >
                      {correctAnswer === idx ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                    </button>
                    <span className="text-xs font-semibold text-gray-500 w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      className="input-field flex-1 py-1.5"
                      placeholder={`ตัวเลือกที่ ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                      disabled={options.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleAddOption} className="mt-3 text-sm text-primary hover:text-primary-dark flex items-center gap-1 mx-auto">
                <Plus className="w-3 h-3" /> เพิ่มตัวเลือก
              </button>
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

      {/* Questions Count */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <FileQuestion className="w-4 h-4" />
        <span>ทั้งหมด {questions.length} คำถาม</span>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length === 0 && !showForm ? (
          <div className="stat-card p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[var(--color-text-secondary)] font-medium">ยังไม่มีคำถามในชุดนี้</p>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary mt-4 inline-flex">
              <Plus className="w-5 h-5" /> เพิ่มคำถามแรก
            </button>
          </div>
        ) : (
          questions.map((q, qIndex) => (
            <div key={q.id} className="stat-card p-5 hover:shadow-md transition-all group">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 bg-blue-50 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
                  {qIndex + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 whitespace-pre-wrap leading-relaxed">{q.questionText}</h4>
                  <div className="mt-2 space-y-1">
                    {q.options.map((opt, idx) => (
                      <div key={idx} className={`flex items-start gap-2 text-sm p-2 rounded-lg ${q.correctAnswer === idx ? 'bg-green-50/60 border border-green-100 text-green-800 font-medium' : 'text-gray-600'}`}>
                        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                          {q.correctAnswer === idx ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <span className="text-gray-400 font-semibold">{idx + 1}.</span>
                          )}
                        </div>
                        <span className="flex-1">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditClick(q)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="แก้ไข">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="ลบ">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
