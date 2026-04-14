import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, GraduationCap, Clock, CheckCircle2 } from 'lucide-react'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function CoursesCatalogPage() {
  const session = await auth()
  const employeeId = session?.user?.id

  // Get all PUBLISHED courses
  const courses = await prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { steps: true, sessions: true }
      }
    }
  })

  // Get employee's assignment/progress info if available
  const assignments = await prisma.courseAssignment.findMany({
    where: { employeeId },
  })
  
  const assignmentMap = new Map(assignments.map(a => [a.courseId, a]))

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'ONLINE': return { label: 'Online', color: 'badge-info' }
      case 'OFFLINE': return { label: 'Offline (อบรมรอบ)', color: 'badge-accent' }
      case 'EXTERNAL': return { label: 'External', color: 'badge-primary' }
      default: return { label: type, color: 'badge-gray' }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">รายการหลักสูตรทั้งหมด</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">เลือกหลักสูตรที่คุณสนใจเพื่อเข้าอบรมได้เลย</p>
      </div>

      {courses.length === 0 ? (
        <div className="stat-card p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)]">ยังไม่มีหลักสูตรที่เปิดให้เข้าเรียนในขณะนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(course => {
            const assignment = assignmentMap.get(course.id)
            const typeInfo = getTypeInfo(course.trainingType)
            
            // Link destination based on type
            let href = `/learning/courses/${course.id}`
            if (course.trainingType === 'OFFLINE') href = `/learning/offline`
            if (course.trainingType === 'EXTERNAL') href = `/learning` // Placeholder

            return (
              <Link 
                key={course.id} 
                href={href}
                className="group stat-card p-0 flex flex-col hover:shadow-lg transition-all border border-[var(--color-border)] hover:border-primary/50 overflow-hidden"
              >
                {/* Card Header Image / Color */}
                <div className="h-24 gradient-bg relative flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-white/30" />
                  <div className="absolute top-3 right-3 flex gap-1">
                    <span className={`badge bg-white shadow-sm text-xs font-bold ${
                      course.trainingType === 'ONLINE' ? 'text-blue-600' : 'text-purple-600'
                    }`}>
                      {typeInfo.label}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-md">
                      {course.code}
                    </span>
                    {course.isMandatory && (
                      <span className="badge badge-danger text-[10px]">บังคับเรียน</span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg text-[var(--color-text)] mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 flex-1">
                    {course.description || 'ไม่มีคำอธิบายสำหรับหลักสูตรนี้'}
                  </p>

                  <div className="border-t border-[var(--color-border)] pt-4 mt-auto flex items-center justify-between">
                    <div className="text-xs text-[var(--color-text-secondary)] font-medium">
                      {course.trainingType === 'ONLINE' ? `${course._count.steps} ขั้นตอนเรียน` : ''}
                      {course.trainingType === 'OFFLINE' ? `${course._count.sessions} รอบอบรม` : ''}
                    </div>

                    {assignment ? (
                      assignment.status === 'COMPLETED' ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านแล้ว
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" /> กำลังเรียน
                        </div>
                      )
                    ) : (
                      <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                        เริ่มเรียนเนื้อหา →
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
