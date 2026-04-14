import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, GraduationCap, Clock, CheckCircle2 } from 'lucide-react'
import { auth } from '@/lib/auth'

import CourseListClient from './CourseListClient'

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

  const mappedCourses = courses.map(course => ({
    id: course.id,
    code: course.code,
    title: course.title,
    description: course.description,
    trainingType: course.trainingType,
    isMandatory: course.isMandatory,
    creditHours: course.creditHours,
    stepCount: course._count?.steps || 0,
    sessionCount: course._count?.sessions || 0,
    assignmentStatus: assignmentMap.get(course.id)?.status || null
  }))

  return <CourseListClient courses={mappedCourses} />
}
