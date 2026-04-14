'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, Video, UserCheck, XCircle, Clock } from 'lucide-react'

export default function ClassroomCourseViewer({ 
  course, 
  sessions, 
  myRegistrations 
}: { 
  course: any, 
  sessions: any[], 
  myRegistrations: any[] 
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleRegister = async (sessionId: string) => {
    if (!confirm('ยืนยันการลงทะเบียนในที่นั่งรอบเวลานี้?')) return
    setLoadingId(sessionId)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/employee/courses/${course.id}/sessions/${sessionId}/register`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        setErrorMsg(d.error || 'เกิดข้อผิดพลาดในการลงทะเบียน')
      } else {
        router.refresh()
      }
    } catch {
      setErrorMsg('Network Error')
    } finally {
      setLoadingId(null)
    }
  }

  const handleCancel = async (sessionId: string) => {
    if (!confirm('ต้องการยกเลิกการลงทะเบียนหรือไม่? ระบบจะเก็บประวัติการยกเลิกของคุณเอาไว้')) return
    setLoadingId(sessionId + '-cancel')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/employee/courses/${course.id}/sessions/${sessionId}/cancel`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        setErrorMsg(d.error || 'เกิดข้อผิดพลาดในการยกเลิก')
      } else {
        router.refresh()
      }
    } catch {
      setErrorMsg('Network Error')
    } finally {
      setLoadingId(null)
    }
  }

  // Get current active registration for this course (can only be registered to 1 session at a time, or multiple depending on policy. We assume multiple is possible, but usually 1)
  const getRegStatus = (sessionId: string) => {
    return myRegistrations.find(r => r.sessionId === sessionId)
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-3xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
        <Users className="w-48 h-48 text-white/5 absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 transform" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold tracking-wider rounded-full mb-4">
            Classroom (เรียนแบบมีรอบ)
          </span>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-white">
            {course.title}
          </h1>
          <p className="text-indigo-100 text-sm md:text-base opacity-90 leading-relaxed max-w-xl">
            {course.description || 'กรุณาเลือกรอบเวลาที่ต้องการเข้าเรียนด้านล่างนี้ คุณสามารถจองที่นั่งได้จนกว่ารอบนั้นจะครบจำนวน'}
          </p>
        </div>
      </div>

      {/* Session List */}
      <div className="space-y-6">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-red-100 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <h2 className="text-xl font-bold text-[var(--color-text)] px-2">รอบอบรมทั้งหมด ({sessions.length} รอบ)</h2>
        
        {sessions.length === 0 ? (
          <div className="stat-card p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>ยังไม่มีการเปิดรอบเวลาสำหรับหลักสูตรนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session: any) => {
              const regCount = session._count?.registrations || 0
              const isFull = regCount >= session.capacity
              const myReg = getRegStatus(session.id)
              
              const isRegistered = myReg?.status === 'REGISTERED' || myReg?.status === 'ATTENDED'
              const isAttended = myReg?.status === 'ATTENDED'
              const isCancelled = myReg?.status === 'CANCELLED'

              const sDate = new Date(session.sessionDate)
              const now = new Date()
              const isPast = sDate < now

              const capacityPercent = Math.min(100, Math.round((regCount / session.capacity) * 100))

              return (
                <div key={session.id} className={`stat-card p-0 flex flex-col overflow-hidden border-2 transition-all ${isRegistered ? 'border-indigo-500 shadow-md ring-4 ring-indigo-50' : 'border-transparent'}`}>
                  
                  {isRegistered && (
                    <div className="bg-indigo-50 text-indigo-700 text-xs font-bold px-4 py-2 flex items-center justify-center gap-1.5 border-b border-indigo-100">
                      <UserCheck className="w-4 h-4" />
                      คุณลงทะเบียนรอบนี้แล้ว
                    </div>
                  )}
                  {isCancelled && (
                    <div className="bg-gray-50 text-gray-500 text-xs font-medium px-4 py-2 flex items-center justify-center gap-1.5 border-b border-gray-100">
                      <XCircle className="w-4 h-4" />
                      คุณเคยกดยกเลิกรอบนี้
                    </div>
                  )}

                  <div className="p-5 flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-[var(--color-text)]">
                          {sDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {sDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' })} น.
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-[var(--color-text-secondary)] leading-relaxed">
                          สถานที่: <span className="text-[var(--color-text)] font-medium">{session.location || 'ไม่ระบุสถานที่'}</span>
                        </span>
                      </div>
                      {session.trainerName && (
                        <div className="flex items-start gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-[var(--color-text-secondary)]">
                            วิทยากร: <span className="text-[var(--color-text)] font-medium">{session.trainerName}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-500">ผู้ลงทะเบียน</span>
                        <span className={isFull ? 'text-red-500 font-bold' : 'text-[var(--color-primary)]'}>
                          {regCount} / {session.capacity}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-[var(--color-primary)]'}`} 
                          style={{ width: `${capacityPercent}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                    {isRegistered ? (
                      <>
                        {isPast ? (
                          session.meetingUrl ? (
                            <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center shadow-lg shadow-primary/20">
                              <Video className="w-4 h-4" />
                              เข้าห้องประชุมออนไลน์
                            </a>
                          ) : (
                            <div className="w-full py-2.5 px-4 text-center text-sm font-bold text-gray-600 bg-gray-200 rounded-xl">
                              ได้เวลาเข้าห้องเรียนแล้ว
                            </div>
                          )
                        ) : (
                          <button disabled className="w-full py-2.5 px-4 text-center text-sm font-medium text-gray-400 bg-gray-200 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                            {session.meetingUrl && <Video className="w-4 h-4" />}
                            ปุ่มจะเปิดให้กดเมื่อถึงเวลาเรียน
                          </button>
                        )}
                        {!isAttended && !isPast && (
                          <button 
                            onClick={() => handleCancel(session.id)}
                            disabled={loadingId !== null}
                            className="mt-2 text-xs font-bold text-red-500 hover:text-red-700 mx-auto block py-1"
                          >
                            {loadingId === session.id + '-cancel' ? 'กำลังยกเลิก...' : 'ยกเลิกการลงทะเบียน'}
                          </button>
                        )}
                      </>
                    ) : (
                      <button 
                        onClick={() => handleRegister(session.id)}
                        disabled={isFull || loadingId !== null || isPast || isAttended}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                          isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                          isFull ? 'bg-red-50 text-red-700 cursor-not-allowed' : 
                          'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 shadow-sm'
                        }`}
                      >
                        {loadingId === session.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                        {isPast ? 'หมดเวลาลงทะเบียนแล้ว' : isFull ? `ที่นั่งเต็ม (${regCount}/${session.capacity})` : 'จองที่นั่งรอบนี้'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
