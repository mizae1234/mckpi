'use client'

import { useState, useEffect } from 'react'
import { PlayCircle, FileText, ClipboardCheck, Lock, CheckCircle2, FastForward } from 'lucide-react'
import Link from 'next/link'
import VideoPlayerComponent from './VideoPlayerComponent'
import QuizComponent from './QuizComponent'
import { useRouter } from 'next/navigation'

interface QuestionData {
  id: string
  questionText: string
  options: string[]
}

interface StepData {
  id: string
  stepType: string
  title: string
  contentUrl: string | null
  minWatchPercent: number
  is_completed: boolean
  watchPercent: number
  is_unlocked: boolean
  is_skipped: boolean
  latestAttemptScore?: number | null
  questions: QuestionData[]
}

interface CoursePlayerProps {
  course: { id: string; title: string; passScore: number }
  steps: StepData[]
}

export default function CoursePlayer({ course, steps: initialSteps }: CoursePlayerProps) {
  const router = useRouter()
  const [steps, setSteps] = useState(initialSteps)
  
  // Default to first unlocked step that isn't completed and isn't skipped
  const [activeStepIndex, setActiveStepIndex] = useState(() => {
    const idx = initialSteps.findIndex(s => s.is_unlocked && !s.is_completed && !s.is_skipped)
    return idx >= 0 ? idx : 0
  })

  useEffect(() => {
    setSteps(initialSteps)
  }, [initialSteps])

  const activeStep = steps[activeStepIndex]

  const handleProgress = (stepId: string, newPercent: number) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, watchPercent: newPercent } : s))
  }

  const getStepIcon = (type: string, isCompleted: boolean, isLocked: boolean, isSkipped: boolean) => {
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-green-500" />
    if (isSkipped) return <FastForward className="w-5 h-5 text-purple-500" />
    if (isLocked) return <Lock className="w-5 h-5 text-gray-300" />
    switch (type) {
      case 'VIDEO': return <PlayCircle className="w-5 h-5 text-blue-500" />
      case 'DOCUMENT': return <FileText className="w-5 h-5 text-orange-500" />
      default: return <ClipboardCheck className="w-5 h-5 text-amber-500" />
    }
  }

  const handleStepComplete = () => {
    // Refresh to recalculate server-side locks and progress
    router.refresh()
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-fade-in max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-gray-50">
          <h2 className="font-bold text-[var(--color-text)]">{activeStep?.title || 'Course Content'}</h2>
          {activeStep?.is_skipped && (
            <span className="badge badge-accent">✨ ข้ามได้ (Pre-test ผ่าน)</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-black/5 relative">
          {activeStep ? (
            activeStep.stepType === 'VIDEO' ? (
              <VideoPlayerComponent 
                courseId={course.id}
                step={activeStep} 
                onComplete={handleStepComplete}
                onProgress={handleProgress}
              />
            ) : ['QUIZ', 'PRETEST', 'POSTTEST'].includes(activeStep.stepType) ? (
              <QuizComponent 
                courseId={course.id}
                step={activeStep}
                passScore={activeStep.stepType === 'PRETEST' ? 0 : course.passScore} 
                onComplete={handleStepComplete} 
              />
            ) : (
              <div className="flex items-center justify-center h-full p-8 text-center flex-col gap-4 bg-white">
                <FileText className="w-16 h-16 text-gray-300" />
                <p className="text-[var(--color-text-secondary)]">เอกสารประกอบการเรียน</p>
                {activeStep.contentUrl && (
                  <a href={activeStep.contentUrl} target="_blank" rel="noreferrer" className="btn-primary">
                    เปิดเอกสาร
                  </a>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">ไม่พบเนื้อหา</div>
          )}
        </div>
      </div>

      {/* Playlist Sidebar */}
      <div className="w-full md:w-80 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-primary)] text-white">
          <Link href="/learning" className="text-sm opacity-80 hover:opacity-100 mb-1 inline-block">← กลับไปหน้ารวมคอร์ส</Link>
          <h3 className="font-bold line-clamp-2">{course.title}</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {steps.map((step, i) => {
            const isLocked = !step.is_unlocked
            const isCurrent = activeStepIndex === i

            return (
              <button
                key={step.id}
                disabled={isLocked}
                onClick={() => setActiveStepIndex(i)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all border ${
                  isCurrent ? 'border-[var(--color-primary)] bg-red-50' : 
                  isLocked ? 'border-transparent bg-gray-50 opacity-60 cursor-not-allowed' : 
                  'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getStepIcon(step.stepType, step.is_completed, isLocked, step.is_skipped)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium line-clamp-2 ${isCurrent ? 'text-primary' : 'text-gray-700'}`}>
                    {i + 1}. {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    {step.stepType === 'VIDEO' && `${step.watchPercent}%`}
                    {step.is_skipped && <span className="text-purple-600 font-medium">ข้ามอัตโนมัติ</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
