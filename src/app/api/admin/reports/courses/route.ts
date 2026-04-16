import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    // ถ้าไม่ระบุ courseId ให้ส่งรายชื่อคอร์สกลับไปให้สร้าง Dropdown
    if (!courseId) {
      const courses = await prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, code: true, title: true, isMandatory: true, trainingType: true },
        orderBy: { code: 'asc' }
      })
      return NextResponse.json({ courses })
    }

    // ถ้าระบุ courseId จะคำนวณ Analytics
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        results: {
          select: { score: true, status: true, pretestScore: true, posttestScore: true }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course Not Found' }, { status: 404 })
    }

    // 1. คำนวณสถิติ
    let passedCount = 0
    let failedCount = 0
    let inProgressCount = 0
    let sumScore = 0
    let scoreCount = 0
    
    // สำหรับ Pre/Post test
    let sumPre = 0, preCount = 0
    let sumPost = 0, postCount = 0

    course.results.forEach(r => {
      if (r.status === 'PASSED') passedCount++
      else if (r.status === 'FAILED') failedCount++
      else inProgressCount++

      if (r.score !== null) {
        sumScore += r.score
        scoreCount++
      }

      if (r.pretestScore !== null) {
        sumPre += r.pretestScore
        preCount++
      }
      
      if (r.posttestScore !== null) {
        sumPost += r.posttestScore
        postCount++
      }
    })

    const totalTrained = course.results.length
    const stats = {
      totalTrained,
      passedCount,
      failedCount,
      inProgressCount,
      passRate: totalTrained > 0 ? Math.round((passedCount / totalTrained) * 100) : 0,
      avgScore: scoreCount > 0 ? Math.round(sumScore / scoreCount) : 0,
      avgPretest: preCount > 0 ? Math.round(sumPre / preCount) : 0,
      avgPosttest: postCount > 0 ? Math.round(sumPost / postCount) : 0,
    }

    // 2. ดึงลิสต์คนที่ยังไม่อบรม (เฉพาะหลักสูตรบังคับ)
    let missingEmployees: any[] = []
    
    if (course.isMandatory) {
      // หา ID ของคนที่อบรมหรือกำลังอบรมไปแล้ว (มี Result)
      const trainedEmployeeIds = new Set(await prisma.trainingResult.findMany({
        where: { courseId },
        select: { employeeId: true }
      }).then(res => res.map(r => r.employeeId)))

      // หาคนทั้งหมดในระบบ
      const allEmployees = await prisma.employee.findMany({
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          branchCode: true,
          positionCode: true,
          startDate: true
        }
      })

      // คัดเฉพาะคนที่ยังไม่มี Result และนับว่าเลย Deadline (Onboarding 14 วัน หรือตามที่ Set ไว้) หรือยัง
      const today = new Date()
      missingEmployees = allEmployees
        .filter(emp => !trainedEmployeeIds.has(emp.id))
        .map(emp => {
          let isOverdue = false
          let daysSinceStart = 0
          if (emp.startDate) {
            const diffTime = Math.abs(today.getTime() - new Date(emp.startDate).getTime())
            daysSinceStart = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            isOverdue = daysSinceStart > course.onboardingDeadlineDays
          }

          return { ...emp, isOverdue, daysSinceStart }
        })
        // เอาคนที่ Overdue ขึ้นก่อน
        .sort((a, b) => (a.isOverdue === b.isOverdue ? 0 : a.isOverdue ? -1 : 1))
    }

    return NextResponse.json({ 
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        trainingType: course.trainingType,
        isMandatory: course.isMandatory,
        onboardingDeadlineDays: course.onboardingDeadlineDays || 0,
        hasDeadline: (course.onboardingDeadlineDays || 0) > 0
      }, 
      stats, 
      missingEmployees 
    })

  } catch (error: any) {
    console.error('Course Analytics API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
