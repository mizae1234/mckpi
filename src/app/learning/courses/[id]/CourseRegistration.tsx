'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle2, Clock, PlayCircle } from 'lucide-react'

export default function CourseRegistration({ course }: { course: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/employee/courses/${course.id}/register`, {
        method: 'POST',
      })
      
      if (res.ok) {
        // Refresh page to show CoursePlayer instead
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'ไม่สามารถลงทะเบียนได้')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      setLoading(false)
    }
  }

  const videoSteps = course.steps.filter((s: any) => s.stepType === 'VIDEO')
  const examSteps = course.steps.filter((s: any) => ['QUIZ', 'PRETEST', 'POSTTEST'].includes(s.stepType))
  
  // Calculate total course watch time if we had duration, but we don't. We just show step counts.

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-[var(--color-border)] overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-br from-red-600 to-red-800 relative flex items-center justify-center p-8">
          <BookOpen className="w-24 h-24 text-white/20 absolute right-8 top-1/2 -translate-y-1/2 scale-150 transform rotate-12" />
          <div className="relative z-10 text-center w-full max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold tracking-wider rounded-full mb-4">
              คอร์สเรียนออนไลน์
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <div className="prose prose-sm md:prose-base max-w-none text-gray-700 mb-10 text-center">
            <p>{course.description || 'เข้าร่วมและศึกษาผ่านหลักสูตรนี้เพื่อเพิ่มทักษะและความรู้ในการทำงานของคุณ กรุณากดลงทะเบียนเรียนเพื่อเริ่มเข้าสู่เนื้อหาบทเรียนและเก็บประวัติการอบรม'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10 max-w-lg mx-auto">
            <div className="bg-red-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <PlayCircle className="w-8 h-8 text-red-500 mb-2" />
              <div className="text-xl font-bold text-gray-800">{videoSteps.length}</div>
              <div className="text-xs text-gray-500 font-medium">วิดีโอ/เอกสาร</div>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-8 h-8 text-amber-500 mb-2" />
              <div className="text-xl font-bold text-gray-800">{examSteps.length}</div>
              <div className="text-xs text-gray-500 font-medium">แบบทดสอบ</div>
            </div>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={handleRegister}
              disabled={loading}
              className={`px-10 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                loading ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-[var(--color-primary)] to-red-500 hover:shadow-red-500/25'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังดำเนินการ...
                </span>
              ) : (
                'ลงทะเบียนเรียน'
              )}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            การลงทะเบียนจะบันทึกข้อมูลเข้าสู่ประวัติการอบรมของคุณ
          </p>
        </div>
      </div>
    </div>
  )
}
