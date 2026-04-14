import { prisma } from '@/lib/prisma'
import CourseTableClient from './CourseTableClient'

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
      kpis: {
        include: { kpi: { select: { id: true, code: true, name: true, year: true } } },
      },
      sessions: {
        include: {
          _count: { select: { registrations: true } }
        },
        orderBy: { sessionDate: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  // Map courses for client
  const mappedCourses = courses.map(course => ({
    id: course.id,
    code: course.code,
    title: course.title,
    trainingType: course.trainingType,
    status: course.status,
    isMandatory: course.isMandatory,
    assignmentCount: course._count.assignments,
    learnerCount: course._count.results,
    sessions: course.sessions // Include nested offline sessions
  }))

  return <CourseTableClient courses={mappedCourses} />
}
