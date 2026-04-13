'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, PlayCircle, ClipboardCheck, FileText, Trash2, GripVertical, Save, X } from 'lucide-react'

interface StepData {
  id: string
  step_type: string
  title: string
  content_url: string | null
  order_index: number
  is_required: boolean
  min_watch_percent: number
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
  const [steps, setSteps] = useState(initialSteps)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAddStep = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      course_id: courseId,
      step_type: formData.get('step_type'),
      title: formData.get('title'),
      content_url: formData.get('content_url') || null,
      is_required: formData.get('is_required') === 'true',
      min_watch_percent: Number(formData.get('min_watch_percent')) || 95,
      order_index: steps.length + 1,
    }

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setShowForm(false)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('ต้องการลบขั้นตอนนี้?')) return

    try {
      await fetch(`/api/admin/courses/${courseId}/steps/${stepId}`, { method: 'DELETE' })
      setSteps(steps.filter(s => s.id !== stepId))
      router.refresh()
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
            const Icon = stepIcons[step.step_type] || FileText
            return (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors group">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <div className="w-8 h-8 rounded-lg bg-red-50 text-primary flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  step.step_type === 'VIDEO' ? 'bg-blue-50 text-blue-600' :
                  step.step_type === 'DOCUMENT' ? 'bg-purple-50 text-purple-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--color-text)]">{step.title}</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span className="badge badge-gray text-[10px]">{stepLabels[step.step_type] || step.step_type}</span>
                    {step.step_type === 'VIDEO' && <span>≥ {step.min_watch_percent}%</span>}
                    {['QUIZ', 'PRETEST', 'POSTTEST'].includes(step.step_type) && (
                      <span>{step.questionCount} คำถาม</span>
                    )}
                    {step.is_required && <span className="text-red-500">* จำเป็น</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteStep(step.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
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
              <select name="step_type" className="input-field py-2 text-sm" required>
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
            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">URL เนื้อหา</label>
              <input name="content_url" className="input-field py-2 text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">% ขั้นต่ำที่ต้องดู</label>
              <input name="min_watch_percent" type="number" className="input-field py-2 text-sm" defaultValue={95} min={0} max={100} />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="is_required" value="false" />
              <input type="checkbox" name="is_required" value="true" defaultChecked className="rounded" />
              <span className="text-[var(--color-text)]">จำเป็นต้องทำ</span>
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
        <button onClick={() => setShowForm(true)} className="w-full p-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          เพิ่มขั้นตอน
        </button>
      )}
    </div>
  )
}
