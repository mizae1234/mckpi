'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, PlayCircle, ClipboardCheck, FileText, Trash2, Save, X, UploadCloud, Settings, ArrowUp, ArrowDown, Pencil } from 'lucide-react'
import { useModal } from '@/components/ModalProvider'

interface StepData {
  id: string
  stepType: string
  title: string
  contentUrl: string | null
  contentFilename: string | null
  orderIndex: number
  isRequired: boolean
  minWatchPercent: number
  questionCount: number
}

const stepIcons: Record<string, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  QUIZ: ClipboardCheck,
  PRETEST: ClipboardCheck,
  POSTTEST: ClipboardCheck,
  DOCUMENT: FileText,
}

const stepLabels: Record<string, string> = {
  VIDEO: 'วิดีโอ',
  QUIZ: 'แบบทดสอบ',
  PRETEST: 'Pre-test',
  POSTTEST: 'Post-test',
  DOCUMENT: 'เอกสาร',
}

export default function CourseStepsManager({ courseId, initialSteps }: { courseId: string; initialSteps: StepData[] }) {
  const router = useRouter()
  const { showAlert, showConfirm } = useModal()
  const [steps, setSteps] = useState(initialSteps)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [selectedStepType, setSelectedStepType] = useState('VIDEO')
  const [isRequiredChecked, setIsRequiredChecked] = useState(true)

  // Edit mode state
  const [editingStep, setEditingStep] = useState<StepData | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editStepType, setEditStepType] = useState('VIDEO')
  const [editIsRequired, setEditIsRequired] = useState(true)
  const [editMinWatchPercent, setEditMinWatchPercent] = useState(95)
  const [editUploadMode, setEditUploadMode] = useState<'url' | 'file'>('file')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editContentUrl, setEditContentUrl] = useState('')
  const [editUploadProgress, setEditUploadProgress] = useState(false)

  const handleAddStep = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    let contentUrl = formData.get('contentUrl') as string | null
    let contentFilename: string | null = null

    try {
      if (uploadMode === 'file' && file) {
        setUploadProgress(true)
        const fileData = new FormData()
        fileData.append('file', file)
        const uploadRes = await fetch(`/api/admin/courses/${courseId}/upload`, {
          method: 'POST',
          body: fileData
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')
        contentUrl = uploadData.url
        contentFilename = uploadData.filename
        setUploadProgress(false)
      }

      const data = {
        courseId: courseId,
        stepType: selectedStepType,
        title: formData.get('title'),
        contentUrl: contentUrl || null,
        contentFilename: contentFilename || null,
        isRequired: isRequiredChecked,
        minWatchPercent: selectedStepType === 'VIDEO' ? (Number(formData.get('minWatchPercent')) || 95) : 0,
        orderIndex: steps.length + 1,
      }

      const res = await fetch(`/api/admin/courses/${courseId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const newStep = await res.json()
        setSteps([...steps, { ...newStep, questionCount: newStep._count?.questions || 0 }])
        setShowForm(false)
        setFile(null)
        setUploadMode('file')
        setIsRequiredChecked(true)
        setSelectedStepType('VIDEO')
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      showAlert({ message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', type: 'danger' })
      setUploadProgress(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    const ok = await showConfirm({ title: 'ลบขั้นตอน', message: 'ต้องการลบขั้นตอนนี้?', type: 'danger', confirmText: 'ลบ' })
    if (!ok) return

    try {
      await fetch(`/api/admin/courses/${courseId}/steps/${stepId}`, { method: 'DELETE' })
      setSteps(steps.filter(s => s.id !== stepId))
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  // ── Edit Step ──
  const startEdit = (step: StepData) => {
    setEditingStep(step)
    setEditTitle(step.title)
    setEditStepType(step.stepType)
    setEditIsRequired(step.isRequired)
    setEditMinWatchPercent(step.minWatchPercent)
    setEditUploadMode(step.contentUrl && !step.contentFilename ? 'url' : 'file')
    setEditContentUrl(step.contentUrl && !step.contentFilename ? step.contentUrl : '')
    setEditFile(null)
  }

  const cancelEdit = () => {
    setEditingStep(null)
    setEditFile(null)
    setEditContentUrl('')
  }

  const handleSaveEdit = async () => {
    if (!editingStep) return
    setLoading(true)

    let finalContentUrl = editingStep.contentUrl
    let finalContentFilename = editingStep.contentFilename

    try {
      if (editUploadMode === 'file' && editFile) {
        setEditUploadProgress(true)
        const fileData = new FormData()
        fileData.append('file', editFile)
        const uploadRes = await fetch(`/api/admin/courses/${courseId}/upload`, {
          method: 'POST',
          body: fileData
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')
        finalContentUrl = uploadData.url
        finalContentFilename = uploadData.filename
        setEditUploadProgress(false)
      } else if (editUploadMode === 'url' && editContentUrl !== editingStep.contentUrl) {
        finalContentUrl = editContentUrl
        finalContentFilename = null
      }

      const res = await fetch(`/api/admin/courses/${courseId}/steps/${editingStep.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          stepType: editStepType,
          isRequired: editIsRequired,
          minWatchPercent: editStepType === 'VIDEO' ? editMinWatchPercent : 0,
          contentUrl: finalContentUrl,
          contentFilename: finalContentFilename,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setSteps(steps.map(s => s.id === editingStep.id ? { ...s, title: updated.title, stepType: updated.stepType, isRequired: updated.isRequired, minWatchPercent: updated.minWatchPercent } : s))
        setEditingStep(null)
        router.refresh()
      } else {
        const errData = await res.json()
        showAlert({ message: errData.error || 'บันทึกไม่สำเร็จ', type: 'danger' })
      }
    } catch (err) {
      console.error(err)
      showAlert({ message: 'เกิดข้อผิดพลาด', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === steps.length - 1) return

    const newSteps = [...steps]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap elements
    const temp = newSteps[index]
    newSteps[index] = newSteps[swapIndex]
    newSteps[swapIndex] = temp

    // Update orderIndex values
    const updatedSteps = newSteps.map((step, i) => ({ ...step, orderIndex: i + 1 }))
    setSteps(updatedSteps)

    try {
      const items = updatedSteps.map(s => ({ stepId: s.id, orderIndex: s.orderIndex }))
      await fetch(`/api/admin/courses/${courseId}/steps/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Steps List */}
      {steps.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)] py-4">ยังไม่มีขั้นตอน กดปุ่มด้านล่างเพื่อเพิ่ม</p>
      ) : (
        <div className="space-y-2">
          {steps.map((step, i) => {
            const Icon = stepIcons[step.stepType] || FileText
            const isEditing = editingStep?.id === step.id

            if (isEditing) {
              // ── Inline Edit Form ──
              return (
                <div key={step.id} className="p-4 rounded-xl border-2 border-primary/50 bg-primary/5 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-primary">แก้ไขขั้นตอนที่ {i + 1}</h4>
                    <button onClick={cancelEdit} className="p-1 hover:bg-gray-100 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text)] mb-1">ประเภท</label>
                      <select 
                        className="input-field py-2 text-sm" 
                        value={editStepType}
                        onChange={(e) => setEditStepType(e.target.value)}
                      >
                        <option value="VIDEO">วิดีโอ</option>
                        <option value="QUIZ">แบบทดสอบ</option>
                        <option value="PRETEST">Pre-test</option>
                        <option value="POSTTEST">Post-test</option>
                        <option value="DOCUMENT">เอกสาร</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text)] mb-1">ชื่อ</label>
                      <input 
                        className="input-field py-2 text-sm" 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                    </div>
                    {editStepType === 'VIDEO' && (
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">% ขั้นต่ำที่ต้องดู</label>
                        <input 
                          type="number" 
                          className="input-field py-2 text-sm" 
                          value={editMinWatchPercent}
                          onChange={(e) => setEditMinWatchPercent(Number(e.target.value))}
                          min={0} max={100}
                        />
                      </div>
                    )}
                    {(editStepType === 'VIDEO' || editStepType === 'DOCUMENT') && (
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-[var(--color-text)]">
                            เปลี่ยนเนื้อหา {editingStep?.contentFilename && <span className="text-gray-400 font-normal">(ปัจจุบัน: {editingStep.contentFilename})</span>}
                          </label>
                          <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button 
                              type="button" 
                              onClick={() => setEditUploadMode('file')}
                              className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${editUploadMode === 'file' ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500'}`}
                            >
                              ไฟล์
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditUploadMode('url')}
                              className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${editUploadMode === 'url' ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500'}`}
                            >
                              URL
                            </button>
                          </div>
                        </div>
                        {editUploadMode === 'url' ? (
                          <input 
                            className="input-field py-2 text-sm" 
                            placeholder="https://..."
                            value={editContentUrl}
                            onChange={(e) => setEditContentUrl(e.target.value)}
                          />
                        ) : (
                          <div className="relative">
                            <input 
                              type="file" 
                              onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                              className="block w-full text-sm text-[var(--color-text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border border-[var(--color-border)] rounded-xl" 
                            />
                            {editUploadProgress && <div className="absolute right-3 top-2.5 text-xs text-primary animate-pulse font-medium">กำลังอัปโหลด...</div>}
                          </div>
                        )}
                        {!editFile && editUploadMode === 'file' && editingStep?.contentFilename && (
                          <p className="text-xs text-gray-400 mt-1">ไม่เลือกไฟล์ = ใช้ไฟล์เดิม</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={editIsRequired}
                        onChange={(e) => setEditIsRequired(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-[var(--color-text)]">จำเป็นต้องทำ (ล็อกไม่ให้ข้ามจนกว่าจะผ่าน)</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelEdit} className="btn-secondary py-1.5 px-3 text-sm">ยกเลิก</button>
                    <button onClick={handleSaveEdit} disabled={loading} className="btn-primary py-1.5 px-3 text-sm">
                      {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> บันทึก</>}
                    </button>
                  </div>
                </div>
              )
            }

            // ── Normal Step Row ──
            return (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors group">
                <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleReorder(i, 'up')}
                    disabled={i === 0}
                    className="p-0.5 text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleReorder(i, 'down')}
                    disabled={i === steps.length - 1}
                    className="p-0.5 text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="w-8 h-8 rounded-lg bg-red-50 text-primary flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  step.stepType === 'VIDEO' ? 'bg-blue-50 text-blue-600' :
                  step.stepType === 'DOCUMENT' ? 'bg-purple-50 text-purple-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--color-text)]">{step.title}</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span className="badge badge-gray text-[10px]">{stepLabels[step.stepType] || step.stepType}</span>
                    {step.stepType === 'VIDEO' && <span>≥ {step.minWatchPercent}%</span>}
                    {['QUIZ', 'PRETEST', 'POSTTEST'].includes(step.stepType) && (
                      <span>{step.questionCount} คำถาม</span>
                    )}
                    {step.isRequired && <span className="text-red-500">* จำเป็น</span>}
                    {step.contentFilename && (
                      <span className="truncate max-w-[150px]" title={step.contentFilename}>📎 {step.contentFilename}</span>
                    )}
                  </div>
                </div>
                {['QUIZ', 'PRETEST', 'POSTTEST'].includes(step.stepType) && (
                  step.questionCount === 0 ? (
                    <button
                      onClick={() => router.push(`/admin/courses/${courseId}/steps/${step.id}`)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium flex items-center gap-1 border border-blue-200 shadow-sm"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      เพิ่มคำถาม
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/admin/courses/${courseId}/steps/${step.id}`)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all mr-1"
                      title="จัดการคำถาม"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )
                )}
                <button
                  onClick={() => startEdit(step)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="แก้ไขขั้นตอน"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteStep(step.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="ลบขั้นตอน"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Step Form */}
      {showForm ? (
        <form onSubmit={handleAddStep} className="p-4 rounded-xl border-2 border-dashed border-[var(--color-border)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[var(--color-text)]">เพิ่มขั้นตอนใหม่</h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">ประเภท</label>
              <select 
                name="stepType" 
                className="input-field py-2 text-sm" 
                value={selectedStepType}
                onChange={(e) => setSelectedStepType(e.target.value)}
                required
              >
                <option value="VIDEO">วิดีโอ</option>
                <option value="QUIZ">แบบทดสอบ</option>
                <option value="PRETEST">Pre-test</option>
                <option value="POSTTEST">Post-test</option>
                <option value="DOCUMENT">เอกสาร</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">ชื่อ</label>
              <input name="title" className="input-field py-2 text-sm" placeholder="เช่น วิดีโอ: บทที่ 1" required />
            </div>
            {(selectedStepType === 'VIDEO' || selectedStepType === 'DOCUMENT') ? (
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[var(--color-text)]">เนื้อหา</label>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button 
                      type="button" 
                      onClick={() => setUploadMode('file')}
                      className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${uploadMode === 'file' ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500'}`}
                    >
                      ไฟล์
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setUploadMode('url')}
                      className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${uploadMode === 'url' ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500'}`}
                    >
                      URL
                    </button>
                  </div>
                </div>
                {uploadMode === 'url' ? (
                  <input name="contentUrl" className="input-field py-2 text-sm" placeholder="https://..." />
                ) : (
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-[var(--color-text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border border-[var(--color-border)] rounded-xl" 
                    />
                    {uploadProgress && <div className="absolute right-3 top-2.5 text-xs text-primary animate-pulse font-medium">กำลังอัปโหลด...</div>}
                  </div>
                )}
              </div>
            ) : (
              <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm text-blue-700">💡 การตั้งค่าคำถามและ % คะแนนสอบผ่าน (Pass Score) สำหรับแบบทดสอบ จะทำในขั้นตอนถัดไป และคะแนนสอบผ่านจะอิงจาก <strong className="font-semibold">"ตั้งค่าคอร์ส"</strong></p>
              </div>
            )}
            {selectedStepType === 'VIDEO' && (
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">% ขั้นต่ำที่ต้องดู</label>
                <input name="minWatchPercent" type="number" className="input-field py-2 text-sm" defaultValue={95} min={0} max={100} />
              </div>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={isRequiredChecked}
                onChange={(e) => setIsRequiredChecked(e.target.checked)}
                className="rounded"
              />
              <span className="text-[var(--color-text)]">จำเป็นต้องทำ (ล็อกไม่ให้ข้ามจนกว่าจะผ่าน)</span>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-1.5 px-3 text-sm">ยกเลิก</button>
            <button type="submit" disabled={loading} className="btn-primary py-1.5 px-3 text-sm">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> บันทึก</>}
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => { setShowForm(true); setEditingStep(null) }} className="w-full p-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          เพิ่มขั้นตอน
        </button>
      )}
    </div>
  )
}
