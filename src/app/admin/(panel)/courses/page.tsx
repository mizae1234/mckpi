import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import DeleteCourseButton from './DeleteCourseButton'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: {
          steps: true,
          sessions: true,
          assignments: true,
          results: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ONLINE': return 'badge-info'
      case 'OFFLINE': return 'badge-accent'
      case 'EXTERNAL': return 'badge-primary'
      default: return 'badge-gray'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'badge-success'
      case 'DRAFT': return 'badge-warning'
      case 'ARCHIVED': return 'badge-gray'
      default: return 'badge-gray'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">จัดการคอร์ส</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">สร้างและจัดการหลักสูตรอบรม</p>
        </div>
        <Link href="/admin/courses/create" className="btn-primary">
          <Plus className="w-5 h-5" />
          สร้างคอร์ส
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="stat-card p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)]">ยังไม่มีคอร์สในระบบ</p>
          <Link href="/admin/courses/create" className="btn-primary mt-4 inline-flex">
            <Plus className="w-5 h-5" />
            สร้างคอร์สแรก
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="stat-card p-5 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-xs text-[var(--color-text-secondary)]">{course.code}</span>
                <div className="flex items-center gap-1">
                  <span className={`badge ${getTypeBadge(course.trainingType)} text-[10px]`}>
                    {course.trainingType}
                  </span>
                  <span className={`badge ${getStatusBadge(course.status)} text-[10px]`}>
                    {course.status}
                  </span>
                  <div className="ml-1 border-l border-gray-200 pl-2">
                    <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-[var(--color-text)] mb-2 group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
                {course.description || 'ไม่มีคำอธิบาย'}
              </p>
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                {course.trainingType === 'ONLINE' && (
                  <span>{course._count.steps} ขั้นตอน</span>
                )}
                {course.trainingType === 'OFFLINE' && (
                  <span>{course._count.sessions} รอบ</span>
                )}
                <span>{course._count.assignments} คนเรียน</span>
                <span>ผ่าน ≥ {course.passScore}%</span>
              </div>
              {course.isMandatory && (
                <div className="mt-3">
                  <span className="badge badge-danger text-[10px]">บังคับ</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
