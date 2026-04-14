'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save, Trash2, Edit2, CheckCircle2, AlertCircle, X, Library, Search, FolderOpen, ArrowLeft } from 'lucide-react'
import { useModal } from '@/components/ModalProvider'

interface QuestionData {
  id: string
  questionText: string
  options: string[]
  correctAnswer: number
  orderNum: number
  masterQuestionId?: string | null
}

interface MasterQuestionData {
  id: string
  questionText: string
  options: string[]
  correctAnswer: number
}

interface QuestionSetData {
  id: string
  name: string
  description: string
  _count: { questions: number }
}

interface QuestionManagerClientProps {
  courseId: string
  stepId: string
  initialQuestions: QuestionData[]
}

export default function QuestionManagerClient({ courseId, stepId, initialQuestions }: QuestionManagerClientProps) {
  const router = useRouter()
  const { showAlert, showConfirm } = useModal()
  const [questions, setQuestions] = useState<QuestionData[]>(initialQuestions)
  const [showForm, setShowForm] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form State
  const [editId, setEditId] = useState<string | null>(null)
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState<number>(0)

  // Bank Modal State
  const [bankSets, setBankSets] = useState<QuestionSetData[]>([])
  const [bankSelectedSetId, setBankSelectedSetId] = useState<string | null>(null)
  const [bankQuestions, setBankQuestions] = useState<MasterQuestionData[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set())
  const [bankSearch, setBankSearch] = useState('')

  const resetForm = () => {
    setEditId(null)
    setQuestionText('')
    setOptions(['', '', '', ''])
    setCorrectAnswer(0)
    setShowForm(false)
  }

  const handleEditClick = (q: QuestionData) => {
    setEditId(q.id)
    setQuestionText(q.questionText)
    setOptions([...q.options])
    setCorrectAnswer(q.correctAnswer)
    setShowForm(true)
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

    setLoading(true)
    try {
      const payload = { questionText, options, correctAnswer, orderNum: editId ? undefined : questions.length + 1 }
      const url = editId
        ? `/api/admin/courses/${courseId}/steps/${stepId}/questions/${editId}`
        : `/api/admin/courses/${courseId}/steps/${stepId}/questions`
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'บันทึกไม่สำเร็จ') }
      const savedQuestion = await res.json()

      if (editId) {
        setQuestions(questions.map(q => q.id === editId ? savedQuestion : q))
      } else {
        setQuestions([...questions, savedQuestion])
      }
      resetForm()
      router.refresh()
    } catch (err) {
      console.error(err)
      showAlert({ message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await showConfirm({ title: 'ลบคำถาม', message: 'ยืนยันที่จะลบคำถามข้อนี้?', type: 'danger', confirmText: 'ลบ' })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/steps/${stepId}/questions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      setQuestions(questions.filter(q => q.id !== id))
      router.refresh()
    } catch (err) {
      console.error(err)
      showAlert({ message: 'ลบไม่สำเร็จ', type: 'danger' })
    }
  }

  // ─── Bank Modal Logic ────────────────────────────
  const openBankModal = async () => {
    setShowBankModal(true)
    setBankLoading(true)
    setSelectedBankIds(new Set())
    setBankSelectedSetId(null)
    setBankQuestions([])
    setBankSearch('')
    try {
      const res = await fetch('/api/admin/question-bank')
      if (res.ok) setBankSets(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setBankLoading(false)
    }
  }

  const selectBankSet = async (setId: string) => {
    setBankSelectedSetId(setId)
    setBankLoading(true)
    setSelectedBankIds(new Set())
    try {
      const res = await fetch(`/api/admin/question-bank/${setId}/questions`)
      if (res.ok) setBankQuestions(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setBankLoading(false)
    }
  }

  const toggleBankSelection = (id: string) => {
    const next = new Set(selectedBankIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedBankIds(next)
  }

  const handleSelectAllBankQuestions = (allVisibleIds: string[]) => {
    const next = new Set(selectedBankIds)
    const allSelected = allVisibleIds.every(id => next.has(id))
    
    if (allSelected) {
      // Deselect all visible
      allVisibleIds.forEach(id => next.delete(id))
    } else {
      // Select all visible
      allVisibleIds.forEach(id => next.add(id))
    }
    
    setSelectedBankIds(next)
  }

  const handleImportFromBank = async () => {
    if (selectedBankIds.size === 0) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/steps/${stepId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterQuestionIds: [...selectedBankIds] }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'นำเข้าไม่สำเร็จ') }
      const imported = await res.json()
      setQuestions([...questions, ...imported])
      setShowBankModal(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      showAlert({ message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const filteredBankQuestions = bankQuestions.filter(q => {
    const alreadyImported = questions.some(eq => eq.masterQuestionId === q.id)
    if (alreadyImported) return false
    if (bankSearch) {
      const lower = bankSearch.toLowerCase()
      if (!q.questionText.toLowerCase().includes(lower) && !q.options.some(o => o.toLowerCase().includes(lower))) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-[var(--color-text)]">รายการคำถาม ({questions.length} ข้อ)</h2>
        {!showForm && (
          <div className="flex gap-2">
            <button onClick={openBankModal} className="btn-secondary py-2 px-3 text-sm flex items-center gap-1">
              <Library className="w-4 h-4" /> เลือกจากคลัง
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary py-2 px-3 text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> เพิ่มใหม่
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-[var(--color-text)]">
              {editId ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}
            </h3>
            <button type="button" onClick={resetForm} className="p-1 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">คำถาม</label>
            <textarea className="input-field w-full min-h-[80px]" placeholder="พิมพ์คำถามของคุณที่นี่..." value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">ตัวเลือก (คลิก ⚪ เพื่อเลือกเป็นข้อที่ถูกต้อง)</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button type="button" onClick={() => setCorrectAnswer(idx)} className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${correctAnswer === idx ? 'text-green-600 bg-green-100' : 'text-gray-300 hover:bg-gray-100'}`}>
                    {correctAnswer === idx ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                  </button>
                  <span className="text-xs font-semibold text-gray-500 w-4">{idx + 1}.</span>
                  <input type="text" className="input-field flex-1 py-1.5" placeholder={`ตัวเลือกที่ ${idx + 1}`} value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} required />
                  <button type="button" onClick={() => handleRemoveOption(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" disabled={options.length <= 2}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={handleAddOption} className="mt-3 text-sm text-primary hover:text-primary-dark flex items-center gap-1 mx-auto">
              <Plus className="w-3 h-3" /> เพิ่มตัวเลือก
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
            <button type="button" onClick={resetForm} className="btn-secondary py-1.5 px-4">ยกเลิก</button>
            <button type="submit" disabled={loading} className="btn-primary py-1.5 px-4">
              {loading ? 'กำลังบันทึก...' : <><Save className="w-4 h-4 mr-1" /> บันทึก</>}
            </button>
          </div>
        </form>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length === 0 && !showForm ? (
          <div className="text-center py-8 text-[var(--color-text-secondary)] bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
            <AlertCircle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="font-medium">ยังไม่มีคำถามสำหรับบทเรียนนี้</p>
            <p className="text-sm mt-1">คลิกที่ปุ่มด้านบนเพื่อเพิ่มคำถามใหม่ หรือเลือกจากคลัง</p>
          </div>
        ) : (
          questions.map((q, qIndex) => (
            <div key={q.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-white hover:border-primary/50 transition-colors shadow-sm group">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-50 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
                  {qIndex + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <h4 className="font-semibold text-gray-800 whitespace-pre-wrap leading-relaxed flex-1">{q.questionText}</h4>
                    {q.masterQuestionId && (
                      <span className="badge badge-info text-[10px] flex-shrink-0 flex items-center gap-0.5" title="คัดลอกจากคลังคำถาม">
                        <Library className="w-3 h-3" /> คลัง
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {q.options.map((opt, idx) => (
                      <div key={idx} className={`flex items-start gap-2 text-sm p-2 rounded-lg ${q.correctAnswer === idx ? 'bg-green-50/50 border border-green-100 text-green-800 font-medium' : 'text-gray-600'}`}>
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

      {/* ─── Bank Selection Modal ─── */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowBankModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                {bankSelectedSetId && (
                  <button onClick={() => { setBankSelectedSetId(null); setBankQuestions([]); setSelectedBankIds(new Set()); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="font-bold text-lg text-[var(--color-text)]">
                    {bankSelectedSetId ? 'เลือกคำถาม' : 'เลือกชุดคำถาม'}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {bankSelectedSetId ? 'เลือกคำถามที่ต้องการนำเข้า (จะถูก Copy มา)' : 'เลือกชุดคำถามที่ต้องการ'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowBankModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-3">
              {bankLoading ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : !bankSelectedSetId ? (
                /* ── Step 1: Show Sets ── */
                bankSets.length === 0 ? (
                  <div className="text-center py-10 text-[var(--color-text-secondary)]">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium">ยังไม่มีชุดคำถามในคลัง</p>
                    <p className="text-sm">ไปสร้างชุดคำถามที่เมนู "คลังคำถาม" ก่อนนะครับ</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bankSets.map((set) => (
                      <button
                        key={set.id}
                        onClick={() => selectBankSet(set.id)}
                        className="w-full text-left p-4 rounded-xl border border-[var(--color-border)] hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-800">{set.name}</div>
                          {set.description && <div className="text-xs text-gray-500 truncate">{set.description}</div>}
                          <div className="text-xs text-gray-400 mt-0.5">{set._count.questions} คำถาม</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                /* ── Step 2: Show Questions in Set ── */
                <>
                  {/* Search and Select All */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="input-field w-full pl-9 py-2 text-sm" placeholder="ค้นหาคำถาม..." value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} />
                    </div>
                    {filteredBankQuestions.length > 0 && (
                      <button
                        onClick={() => handleSelectAllBankQuestions(filteredBankQuestions.map(q => q.id))}
                        className="flex-shrink-0 text-sm font-medium text-primary hover:text-primary-dark px-3 py-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        {filteredBankQuestions.every(q => selectedBankIds.has(q.id)) ? 'เลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                      </button>
                    )}
                  </div>

                  {filteredBankQuestions.length === 0 ? (
                    <div className="text-center py-10 text-[var(--color-text-secondary)]">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="font-medium">ไม่มีคำถามให้เลือก</p>
                      <p className="text-sm">อาจถูกนำเข้าไปหมดแล้ว หรือไม่พบจากการค้นหา</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredBankQuestions.map((q) => {
                        const isSelected = selectedBankIds.has(q.id)
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => toggleBankSelection(q.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-[var(--color-border)] hover:border-gray-300'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                                {isSelected && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm text-gray-800">{q.questionText}</span>
                                <div className="mt-1 text-xs text-gray-500">
                                  {q.options.length} ตัวเลือก • เฉลย: ข้อ {q.correctAnswer + 1}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {bankSelectedSetId && (
              <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  เลือกแล้ว {selectedBankIds.size} ข้อ
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowBankModal(false)} className="btn-secondary py-2 px-4">ยกเลิก</button>
                  <button type="button" onClick={handleImportFromBank} disabled={selectedBankIds.size === 0 || loading} className="btn-primary py-2 px-4">
                    {loading ? 'กำลังนำเข้า...' : <><Library className="w-4 h-4" /> นำเข้า ({selectedBankIds.size})</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
