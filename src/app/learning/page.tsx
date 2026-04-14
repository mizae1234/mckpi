'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight, CheckCircle2, Clock, AlertTriangle, PlayCircle } from 'lucide-react'

interface AssignmentData {
  id: string
  course: {
    id: string
    code: string
    title: string
    trainingType: string
    isMandatory: boolean
  }
  status: string
  dueDate: string | null
  assignedAt: string
}

export default function LearningDashboard() {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<AssignmentData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/employee/assignments')
      if (res.ok) {
        const data = await res.json()
        setAssignments(data)
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const completed = assignments.filter(a => a.status === 'COMPLETED').length
  const inProgress = assignments.filter(a => a.status === 'IN_PROGRESS').length
  const notStarted = assignments.filter(a => a.status === 'NOT_STARTED').length

  const getStatusInfo = (status: string, dueDate: string | null, trainingType?: string) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'COMPLETED'
    if (isOverdue) return { label: 'เลยกำหนด', color: 'badge-danger', icon: AlertTriangle }
    if (status === 'COMPLETED') return { label: 'เสร็จแล้ว', color: 'badge-success', icon: CheckCircle2 }
    if (status === 'IN_PROGRESS') {
      if (trainingType === 'OFFLINE') return { label: 'ลงทะเบียนแล้ว', color: 'badge-accent', icon: Clock }
      return { label: 'กำลังเรียน', color: 'badge-warning', icon: Clock }
    }
    return { label: 'ยังไม่เริ่ม', color: 'badge-gray', icon: PlayCircle }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ONLINE': return { label: 'Online', color: 'badge-info' }
      case 'OFFLINE': return { label: 'Classroom (ตามรอบ / ไลฟ์)', color: 'badge-accent' }
      case 'EXTERNAL': return { label: 'External', color: 'badge-primary' }
      default: return { label: type, color: 'badge-gray' }
    }
  }

  // Group assignments based on new design rules
  const pendingMandatory = assignments.filter(a => a.course.isMandatory && a.status !== 'COMPLETED')
  const pendingGeneral = assignments.filter(a => !a.course.isMandatory && a.status !== 'COMPLETED')
  const completedCourses = assignments.filter(a => a.status === 'COMPLETED')

  const renderCourseCard = (assignment: AssignmentData, isUrgent: boolean = false) => {
    const statusInfo = getStatusInfo(assignment.status, assignment.dueDate, assignment.course.trainingType)
    const typeInfo = getTypeLabel(assignment.course.trainingType)
    const StatusIcon = statusInfo.icon

    return (
      <Link
        key={assignment.id}
        href={
          assignment.course.trainingType === 'ONLINE'
            ? `/learning/courses/${assignment.course.id}`
            : assignment.course.trainingType === 'OFFLINE'
              ? `/learning/courses/${assignment.course.id}`
              : '/learning/results'
        }
        className={`block stat-card p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
          isUrgent ? 'border-red-200 bg-red-50/10 shadow-sm hover:shadow-md' : 'hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            assignment.status === 'COMPLETED'
              ? 'bg-green-100 text-green-600'
              : assignment.status === 'IN_PROGRESS'
                ? isUrgent ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                : 'bg-gray-100 text-gray-400'
          }`}>
            <StatusIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold truncate ${isUrgent ? 'text-red-700' : 'text-[var(--color-text)]'}`}>
                {assignment.course.title}
              </h3>
              {assignment.course.isMandatory && (
                <span className={`badge ${isUrgent ? 'bg-red-500 text-white border-transparent' : 'badge-danger'} text-[10px]`}>
                  บังคับ
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${typeInfo.color} text-[10px]`}>{typeInfo.label}</span>
              <span className={`badge ${statusInfo.color} text-[10px]`}>{statusInfo.label}</span>
              {assignment.dueDate && (
                <span className={`text-xs ${isUrgent ? 'text-red-600 font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                  กำหนด: {new Date(assignment.dueDate).toLocaleDateString('th-TH')}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isUrgent ? 'text-red-400' : 'text-gray-400'}`} />
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="gradient-bg rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-1/2 w-24 h-24 rounded-full bg-[var(--color-accent)]/20" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            สวัสดี, {session?.user?.name} 👋
          </h1>
          <p className="text-white/80">
            {completed === assignments.length && assignments.length > 0
              ? 'คุณผ่านการอบรมทั้งหมดเรียบร้อยแล้ว! 🎉'
              : `คุณมีคอร์สที่ต้องเรียน ${assignments.length - completed} คอร์ส`}
          </p>
        </div>
      </div>

      {/* Alert Banner for Mandatory Courses */}
      {pendingMandatory.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4 animate-fade-in shadow-sm">
          <div className="p-2 bg-red-100 rounded-xl text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-red-800 font-bold mb-1">แจ้งเตือนหลักสูตรบังคับ!</h3>
            <p className="text-red-600 text-sm">
              คุณมี <strong>{pendingMandatory.length} หลักสูตรบังคับ</strong> ที่ต้องเรียนให้จบ กรุณาดำเนินการโดยเร็วที่สุด
            </p>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <div className="text-3xl font-bold text-green-600">{completed}</div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">เสร็จแล้ว</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-3xl font-bold text-amber-500">{inProgress}</div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">กำลังเรียน</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-3xl font-bold text-gray-400">{notStarted}</div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">ยังไม่เริ่ม</div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="stat-card p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)]">ย้งไม่มีคอร์สที่ได้รับมอบหมาย</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Mandatory Courses */}
          {pendingMandatory.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                หลักสูตรบังคับที่ต้องดำเนินการ
              </h2>
              <div className="space-y-3">
                {pendingMandatory.map(assignment => renderCourseCard(assignment, true))}
              </div>
            </div>
          )}

          {/* Section 2: General Courses */}
          {pendingGeneral.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                คอร์สทั่วไปที่ได้รับมอบหมาย
              </h2>
              <div className="space-y-3">
                {pendingGeneral.map(assignment => renderCourseCard(assignment, false))}
              </div>
            </div>
          )}

          {/* Section 3: Completed Courses */}
          {completedCourses.length > 0 && (
            <div className="space-y-4 opacity-75">
              <h2 className="text-lg font-bold text-green-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                คอร์สที่เรียนจบแล้ว
              </h2>
              <div className="space-y-3">
                {completedCourses.map(assignment => renderCourseCard(assignment, false))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
