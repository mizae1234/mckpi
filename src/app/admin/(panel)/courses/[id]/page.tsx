import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PlayCircle, ClipboardCheck, FileText, Target } from 'lucide-react'
import CourseStepsManager from './CourseStepsManager'
import CourseDocumentsManager from './CourseDocumentsManager'
import CourseStatusToggle from './CourseStatusToggle'
import CourseSessionsManager from './CourseSessionsManager'
import CourseEditButton from './CourseEditButton'

export const dynamic = 'force-dynamic'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { orderIndex: 'asc' }, include: { _count: { select: { questions: true } } } },
      documents: { orderBy: { createdAt: 'desc' } },
      sessions: {
        orderBy: { sessionDate: 'desc' },
        include: { _count: { select: { registrations: true } } }
      },
      _count: { select: { assignments: true, results: true } },
      kpis: {
        include: { kpi: { select: { id: true, code: true, name: true, year: true, target: true } } },
      },
    },
  })

  if (!course) return notFound()

  const getTypeBadge = (type: string) => {
    switch (type) { case 'ONLINE': return 'badge-info'; case 'OFFLINE': return 'badge-accent'; default: return 'badge-primary' }
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
            <span className={`badge ${getTypeBadge(course.trainingType)} text-[10px]`}>
              {course.trainingType === 'ONLINE' ? 'ออนไลน์ (วิดีโอ + ข้อสอบ)' : 
               course.trainingType === 'OFFLINE' ? 'Classroom (ตามรอบ / ไลฟ์)' : 
               'ภายนอก (แนบเอกสาร)'}
            </span>
            <span className={`badge ${
              course.status === 'PUBLISHED' ? 'badge-success' : 
              course.status === 'COMPLETED' ? 'badge-info' : 
              course.status === 'ARCHIVED' ? 'badge-gray' : 
              'badge-warning'
            } text-[10px]`}>
              {course.status === 'COMPLETED' ? '✅ เสร็จสิ้น' : course.status}
            </span>
            {course.isMandatory && <span className="badge badge-danger text-[10px]">บังคับ</span>}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{course.title}</h1>
            <CourseEditButton course={{
              id: course.id,
              title: course.title,
              description: course.description,
              passScore: course.passScore,
              creditHours: course.creditHours,
              isMandatory: course.isMandatory,
              onboardingDeadlineDays: course.onboardingDeadlineDays,
              trainingType: course.trainingType,
              kpiIds: course.kpis.map(kc => kc.kpi.id),
            }} />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{course.description || 'ไม่มีคำอธิบาย'}</p>

          {/* KPI Badges */}
          {course.kpis.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {course.kpis.map(kc => (
                <span key={kc.kpi.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                  <Target className="w-3 h-3" />
                  {kc.kpi.name}
                  <span className="text-orange-400 text-[10px]">({kc.kpi.year})</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <CourseStatusToggle courseId={course.id} currentStatus={course.status} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-[var(--color-text)]">{course.passScore}%</div>
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

      {/* Course Steps (ONLINE & OFFLINE) */}
      {(course.trainingType === 'ONLINE' || course.trainingType === 'OFFLINE') && (
        <div className="stat-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--color-text)]">โครงสร้างบทเรียน</h2>
          </div>

          <CourseStepsManager courseId={course.id} initialSteps={course.steps.map(s => ({
            id: s.id,
            stepType: s.stepType,
            title: s.title,
            contentUrl: s.contentUrl,
            contentFilename: s.contentFilename,
            orderIndex: s.orderIndex,
            isRequired: s.isRequired,
            minWatchPercent: s.minWatchPercent,
            questionCount: s._count.questions,
          }))} />
        </div>
      )}

      {/* Sessions (All types) */}
      <div className="stat-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--color-text)]">รอบอบรม</h2>
        </div>
        <CourseSessionsManager courseId={course.id} initialSessions={course.sessions.map(s => ({
          id: s.id,
          sessionDate: s.sessionDate.toISOString(),
          sessionEndDate: s.sessionEndDate?.toISOString() || null,
          registrationEndDate: s.registrationEndDate?.toISOString() || null,
          location: s.location,
          capacity: s.capacity,
          waitlistCapacity: s.waitlistCapacity,
          trainerName: s.trainerName,
          registrationCount: s._count.registrations,
        }))} />
      </div>

      {/* Course Documents (all types) */}
      <div className="stat-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--color-text)]">เอกสารเพิ่มเติม</h2>
        </div>
        <CourseDocumentsManager courseId={course.id} initialDocs={course.documents.map(d => ({
          id: d.id,
          filename: d.filename,
          fileUrl: d.fileUrl,
          fileSize: d.fileSize,
          fileType: d.fileType,
          createdAt: d.createdAt.toISOString(),
        }))} />
      </div>
    </div>
  )
}
