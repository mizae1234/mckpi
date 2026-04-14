'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

export default function QuizComponent({ step, courseId, passScore, onComplete }: { step: any, courseId: string, passScore: number, onComplete: () => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ score: number, is_passed: boolean, should_complete_step: boolean } | null>(null)
  const [warning, setWarning] = useState('')

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (result) return // Disable after submit
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < step.questions.length) {
      setWarning('กรุณาตอบคำถามให้ครบทุกข้อ')
      setTimeout(() => setWarning(''), 3000)
      return
    }
    setWarning('')

    setLoading(true)
    try {
      const res = await fetch('/api/employee/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.id,
          courseId: courseId,
          answers
        })
      })

      if (res.ok) {
        const data = await res.json()
        setResult(data)
        if (data.should_complete_step && !step.is_completed) {
          onComplete()
        }
      } else {
        const errData = await res.json()
        setWarning(errData.error || 'เกิดข้อผิดพลาดในการส่งคำตอบ')
      }
    } catch (e) {
      console.error(e)
      setWarning('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  if (step.is_completed && !result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white animate-fade-in">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-[var(--color-text)]">คุณทำแบบทดสอบนี้ผ่านเรียบร้อยแล้ว</h3>
        
        {step.latestAttemptScore !== null && step.latestAttemptScore !== undefined && (
          <div className="my-6">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">คะแนนล่าสุดของคุณ</p>
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 border-4 shadow-inner text-3xl font-bold text-primary border-[var(--color-primary)]">
              {step.latestAttemptScore}%
            </div>
          </div>
        )}

        <p className="text-[var(--color-text-secondary)] mt-2">โปรดไปศึกษาขั้นตอนถัดไปที่แถบเมนูด้านขวา</p>
      </div>
    )
  }

  return (
    <div className="p-8 bg-white h-full overflow-y-auto">
      {result ? (
        <div className="max-w-xl mx-auto text-center py-12 space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 border-4 shadow-inner text-3xl font-bold text-primary border-[var(--color-primary)]">
            {result.score}%
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-[var(--color-text)]">
              {result.is_passed ? 'ยินดีด้วย! คุณสอบผ่าน' : step.stepType === 'PRETEST' ? 'การทดสอบเสร็จสิ้น' : 'เสียใจด้วย คุณสอบไม่ผ่าน'}
            </h3>
            
            {!result.is_passed && step.stepType === 'PRETEST' && (
              <p className="text-[var(--color-text-secondary)] mt-2">คุณจะต้องเรียนเนื้อหาให้ครบก่อนเพื่อปลดล็อคบททดสอบ Final</p>
            )}
            {result.is_passed && step.stepType === 'PRETEST' && (
              <p className="text-[var(--color-text-secondary)] mt-2 text-green-600 font-medium">✨ คุณทำคะแนนได้ดีเยี่ยม! ระบบปลดล็อคแบบทดสอบ Final ให้ทันที</p>
            )}
            {!result.is_passed && step.stepType !== 'PRETEST' && (
              <p className="text-[var(--color-text-secondary)] mt-2">คะแนนที่ต้องการ: {passScore}%</p>
            )}
          </div>

          {!result.is_passed && step.stepType !== 'PRETEST' && (
            <button onClick={() => { setResult(null); setAnswers({}) }} className="btn-secondary mx-auto mt-4">
              <RefreshCw className="w-5 h-5" /> ทำแบบทดสอบอีกครั้ง
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[var(--color-text)]">{step.title}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">ทั้งหมด {step.questions.length} ข้อ</p>
          </div>

          {step.questions.map((q: any, i: number) => {
            const optionsList = Array.isArray(q.options) 
              ? q.options 
              : (typeof q.options === 'string' ? (()=>{ try{ return JSON.parse(q.options)}catch{return []} })() : [])
            
            return (
            <div key={q.id} className="p-6 rounded-2xl border border-[var(--color-border)] bg-gray-50/50 space-y-4">
              <h4 className="font-medium text-[var(--color-text)]">ข้อที่ {i + 1}. {q.questionText}</h4>
              <div className="space-y-3">
                {optionsList.map((opt: string, optIndex: number) => (
                  <label 
                    key={optIndex} 
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      answers[q.id] === optIndex 
                        ? 'border-[var(--color-primary)] bg-red-50 text-primary font-medium' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name={`q_${q.id}`} 
                      checked={answers[q.id] === optIndex}
                      onChange={() => handleSelect(q.id, optIndex)}
                      className="w-4 h-4 text-[var(--color-primary)] border-gray-300 focus:ring-[var(--color-primary)]"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )})}

          {warning && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {warning}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className={`px-8 transition-colors ${loading ? 'btn-secondary text-gray-500' : 'btn-primary'}`}
            >
              {loading ? 'กำลังส่งคำตอบ...' : 'ส่งคำตอบ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
