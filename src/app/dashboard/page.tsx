'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlayCircle, ClipboardCheck, Award, ChevronRight, CheckCircle2, Lock, AlertCircle } from 'lucide-react'

interface ProgressData {
  videoProgress: number
  videoCompleted: boolean
  quizPassed: boolean
  quizAttempts: number
  maxAttempts: number
  quizScore: number | null
  certificateNo: string | null
  onboardingStatus: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/driver/progress')
      const data = await res.json()
      setProgress(data)
    } catch (err) {
      console.error('Failed to fetch progress:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-ev7-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const steps = [
    {
      id: 'video',
      title: 'ดูวิดีโออบรม',
      desc: `ดูวิดีโอให้ครบ 95% - ปัจจุบัน ${Math.round(progress?.videoProgress || 0)}%`,
      icon: PlayCircle,
      status: progress?.videoCompleted ? 'completed' : 'active',
      href: '/dashboard/training',
      color: 'blue',
    },
    {
      id: 'quiz',
      title: 'ทำแบบทดสอบ',
      desc: progress?.quizPassed 
        ? `ผ่านแล้ว คะแนน ${progress.quizScore}%`
        : progress?.videoCompleted 
          ? `ทำแบบทดสอบ (${progress?.quizAttempts || 0}/${progress?.maxAttempts || 3} ครั้ง)`
          : 'ต้องดูวิดีโอให้ครบก่อน',
      icon: ClipboardCheck,
      status: progress?.quizPassed ? 'completed' : progress?.videoCompleted ? 'active' : 'locked',
      href: '/dashboard/quiz',
      color: 'amber',
    },
    {
      id: 'certificate',
      title: 'รับใบ Certificate',
      desc: progress?.certificateNo
        ? `Certificate: ${progress.certificateNo}`
        : 'จะได้รับเมื่อสอบผ่าน',
      icon: Award,
      status: progress?.certificateNo ? 'completed' : progress?.quizPassed ? 'active' : 'locked',
      href: '/dashboard/certificate',
      color: 'emerald',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="gradient-bg rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-1/2 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            สวัสดี, {session?.user?.name} 👋
          </h1>
          <p className="text-white/80">
            {progress?.onboardingStatus === 'PASSED'
              ? 'คุณผ่านการอบรมเรียบร้อยแล้ว!'
              : 'มาเริ่มการอบรมเพื่อรับใบ Certificate กันเลย'}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <div className="relative mx-auto w-16 h-16 mb-2">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="6" fill="none" />
              <circle
                cx="32" cy="32" r="28"
                stroke="#10b981" strokeWidth="6" fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - (progress?.videoProgress || 0) / 100)}`}
                strokeLinecap="round"
                className="progress-ring"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
              {Math.round(progress?.videoProgress || 0)}%
            </div>
          </div>
          <div className="text-xs text-gray-500">วิดีโอ</div>
        </div>

        <div className="stat-card text-center">
          <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
            {progress?.quizPassed ? (
              <CheckCircle2 className="w-12 h-12 text-ev7-500" />
            ) : progress?.videoCompleted ? (
              <ClipboardCheck className="w-12 h-12 text-amber-500" />
            ) : (
              <Lock className="w-12 h-12 text-gray-300" />
            )}
          </div>
          <div className="text-xs text-gray-500">
            {progress?.quizPassed ? 'สอบผ่าน' : progress?.videoCompleted ? 'พร้อมสอบ' : 'ล็อค'}
          </div>
        </div>

        <div className="stat-card text-center">
          <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
            {progress?.certificateNo ? (
              <Award className="w-12 h-12 text-ev7-500" />
            ) : (
              <Award className="w-12 h-12 text-gray-300" />
            )}
          </div>
          <div className="text-xs text-gray-500">
            {progress?.certificateNo ? 'ได้รับแล้ว' : 'ยังไม่ได้รับ'}
          </div>
        </div>
      </div>

      {/* Step Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">ขั้นตอนการอบรม</h2>
        {steps.map((step, i) => (
          <Link
            key={step.id}
            href={step.status === 'locked' ? '#' : step.href}
            className={`block stat-card p-5 ${step.status === 'locked' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                step.status === 'completed'
                  ? 'bg-ev7-100 text-ev7-600'
                  : step.status === 'active'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : step.status === 'locked' ? (
                  <Lock className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-500 truncate">{step.desc}</p>
              </div>
              {step.status !== 'locked' && (
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
