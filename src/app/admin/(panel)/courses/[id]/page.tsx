import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, PlayCircle, ClipboardCheck, FileText, Edit } from 'lucide-react'
import CourseStepsManager from './CourseStepsManager'

export const dynamic = 'force-dynamic'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { order_index: 'asc' }, include: { _count: { select: { questions: true } } } },
      sessions: { orderBy: { session_date: 'desc' }, include: { _count: { select: { registrations: true } } } },
      _count: { select: { assignments: true, results: true } },
    },
  })

  if (!course) return notFound()

  const getTypeBadge = (type: string) => {
    switch (type) { case 'ONLINE': return 'badge-info'; case 'OFFLINE': return 'badge-accent'; default: return 'badge-primary' }
  }
  const getStepIcon = (type: string) => {
    switch (type) { case 'VIDEO': return PlayCircle; case 'DOCUMENT': return FileText; default: return ClipboardCheck }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/courses" className="btn-secondary py-2 px-3 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-[var(--color-text-secondary)]">{course.code}</span>
            <span className={`badge ${getTypeBadge(course.training_type)} text-[10px]`}>{course.training_type}</span>
            <span className={`badge ${course.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'} text-[10px]`}>{course.status}</span>
            {course.is_mandatory && <span className="badge badge-danger text-[10px]">บังคับ</span>}
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{course.title}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{course.description || 'ไม่มีคำอธิบาย'}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-[var(--color-text)]">{course.pass_score}%</div>
          <div className="text-xs text-[var(--color-text-secondary)]">คะแนนผ่าน</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-[var(--color-text)]">{course.steps.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">ขั้นตอน</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-[var(--color-text)]">{course._count.assignments}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">คนเรียน</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-green-600">{course._count.results}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">ผลลัพธ์</div>
        </div>
      </div>

      {/* Course Steps (ONLINE only) */}
      {course.training_type === 'ONLINE' && (
        <div className="stat-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-text)]">โครงสร้างบทเรียน</h2>
          </div>

          <CourseStepsManager courseId={course.id} initialSteps={course.steps.map(s => ({
            id: s.id,
            step_type: s.step_type,
            title: s.title,
            content_url: s.content_url,
            order_index: s.order_index,
            is_required: s.is_required,
            min_watch_percent: s.min_watch_percent,
            questionCount: s._count.questions,
          }))} />
        </div>
      )}

      {/* Offline Sessions */}
      {course.training_type === 'OFFLINE' && (
        <div className="stat-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-text)]">รอบอบรม</h2>
          </div>

          {course.sessions.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">ยังไม่มีรอบอบรม</p>
          ) : (
            <div className="space-y-3">
              {course.sessions.map(session => (
                <div key={session.id} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-[var(--color-text)]">
                      {session.session_date.toLocaleDateString('th-TH', { dateStyle: 'long' })}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      📍 {session.location} • 👤 {session.trainer_name}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{session._count.registrations}</span>
                    <span className="text-[var(--color-text-secondary)]"> / {session.capacity} คน</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
