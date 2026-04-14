import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import TraineesClient from './TraineesClient'

export const dynamic = 'force-dynamic'

export default async function TraineesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { sessionDate: 'asc' },
        include: {
          registrations: {
            include: {
              employee: {
                select: {
                  id: true,
                  employeeCode: true,
                  fullName: true,
                  branchCode: true,
                  departmentCode: true,
                }
              }
            },
            orderBy: { registeredAt: 'asc' }
          }
        }
      },
      results: {
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              branchCode: true,
              departmentCode: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!course) return notFound()

  const sessions = course.sessions.map(s => ({
    id: s.id,
    sessionDate: s.sessionDate.toISOString(),
    sessionEndDate: s.sessionEndDate?.toISOString() || null,
    location: s.location,
    capacity: s.capacity,
    trainerName: s.trainerName,
    registrations: s.registrations.map(r => ({
      id: r.id,
      status: r.status,
      registeredAt: r.registeredAt.toISOString(),
      employee: r.employee,
    }))
  }))

  // Online learners from TrainingResult (no session-based registration)
  const onlineLearners = course.results.map(r => ({
    id: r.id,
    status: r.status, // PASSED / IN_PROGRESS / FAILED
    source: r.source,
    score: r.score,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() || null,
    employee: r.employee,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses" className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-accent text-[10px]">{course.code}</span>
            <span className="badge badge-info text-[10px]">{course.trainingType === 'OFFLINE' ? 'CLASSROOM' : course.trainingType}</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mt-1">จัดการผู้เข้าอบรม</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{course.title}</p>
        </div>
      </div>

      <TraineesClient 
        courseId={course.id} 
        trainingType={course.trainingType}
        sessions={sessions} 
        onlineLearners={onlineLearners}
      />
    </div>
  )
}
