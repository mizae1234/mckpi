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
    training_type: string
    is_mandatory: boolean
  }
  status: string
  due_date: string | null
  assigned_at: string
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

  const getStatusInfo = (status: string, dueDate: string | null) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'COMPLETED'
    if (isOverdue) return { label: 'เลยกำหนด', color: 'badge-danger', icon: AlertTriangle }
    if (status === 'COMPLETED') return { label: 'เสร็จแล้ว', color: 'badge-success', icon: CheckCircle2 }
    if (status === 'IN_PROGRESS') return { label: 'กำลังเรียน', color: 'badge-warning', icon: Clock }
    return { label: 'ยังไม่เริ่ม', color: 'badge-gray', icon: PlayCircle }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ONLINE': return { label: 'Online', color: 'badge-info' }
      case 'OFFLINE': return { label: 'Offline', color: 'badge-accent' }
      case 'EXTERNAL': return { label: 'External', color: 'badge-primary' }
      default: return { label: type, color: 'badge-gray' }
    }
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

      {/* Course List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text)]">คอร์สที่ได้รับมอบหมาย</h2>

        {assignments.length === 0 ? (
          <div className="stat-card p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[var(--color-text-secondary)]">ยังไม่มีคอร์สที่ได้รับมอบหมาย</p>
          </div>
        ) : (
          assignments.map((assignment, i) => {
            const statusInfo = getStatusInfo(assignment.status, assignment.due_date)
            const typeInfo = getTypeLabel(assignment.course.training_type)
            const StatusIcon = statusInfo.icon

            return (
              <Link
                key={assignment.id}
                href={
                  assignment.course.training_type === 'ONLINE'
                    ? `/learning/courses/${assignment.course.id}`
                    : assignment.course.training_type === 'OFFLINE'
                      ? '/learning/offline'
                      : '/learning/results'
                }
                className="block stat-card p-5 cursor-pointer"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    assignment.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-600'
                      : assignment.status === 'IN_PROGRESS'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--color-text)] truncate">{assignment.course.title}</h3>
                      {assignment.course.is_mandatory && (
                        <span className="badge badge-danger text-[10px]">บังคับ</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${typeInfo.color} text-[10px]`}>{typeInfo.label}</span>
                      <span className={`badge ${statusInfo.color} text-[10px]`}>{statusInfo.label}</span>
                      {assignment.due_date && (
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          กำหนด: {new Date(assignment.due_date).toLocaleDateString('th-TH')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
