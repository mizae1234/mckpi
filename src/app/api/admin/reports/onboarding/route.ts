import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId') || ''
    const branchCode = searchParams.get('branchCode') || ''
    const startDateFrom = searchParams.get('startDateFrom') || ''
    const startDateTo = searchParams.get('startDateTo') || ''

    // 1. หา mandatory courses (ถ้าเลือกเฉพาะ courseId ก็ filter)
    const mandatoryCourses = await prisma.course.findMany({
      where: {
        isMandatory: true,
        status: 'PUBLISHED',
        ...(courseId ? { id: courseId } : {}),
      },
      select: { id: true, code: true, title: true, onboardingDeadlineDays: true },
    })

    if (mandatoryCourses.length === 0) {
      return NextResponse.json({ branches: [], employees: [], courses: [], summary: { totalBranches: 0, passedBranches: 0, failedBranches: 0 } })
    }

    // 2. ดึงพนักงานทั้งหมด (filter ตาม startDate range + branchCode)
    const employeeWhere: any = { status: 'ACTIVE' }
    if (branchCode) employeeWhere.branchCode = branchCode
    if (startDateFrom || startDateTo) {
      employeeWhere.startDate = {}
      if (startDateFrom) employeeWhere.startDate.gte = new Date(`${startDateFrom}T00:00:00.000Z`)
      if (startDateTo) employeeWhere.startDate.lte = new Date(`${startDateTo}T23:59:59.999Z`)
    }

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        positionCode: true,
        positionLevel: true,
        branchCode: true,
        departmentCode: true,
        startDate: true,
        branch: { select: { name: true, isHeadOffice: true } },
      },
      orderBy: { employeeCode: 'asc' },
    })

    // 3. ดึง Training Results สำหรับ mandatory courses
    const courseIds = mandatoryCourses.map(c => c.id)
    const employeeIds = employees.map(e => e.id)

    const results = await prisma.trainingResult.findMany({
      where: {
        courseId: { in: courseIds },
        employeeId: { in: employeeIds },
        status: 'PASSED',
      },
      select: {
        employeeId: true,
        courseId: true,
        completedAt: true,
        source: true,
        score: true,
      },
    })

    // 4. Map results by employeeId+courseId
    const resultMap = new Map<string, typeof results[0]>()
    for (const r of results) {
      const key = `${r.employeeId}_${r.courseId}`
      // เอาผลที่ completedAt เร็วที่สุด (กรณีมีหลาย source)
      const existing = resultMap.get(key)
      if (!existing || (r.completedAt && (!existing.completedAt || r.completedAt < existing.completedAt))) {
        resultMap.set(key, r)
      }
    }

    // 5. คำนวณผลรายคน
    const employeeDetails = employees.map(emp => {
      // ใช้ course แรก (หรือวนทุก mandatory course)
      const courseResults = mandatoryCourses.map(course => {
        const key = `${emp.id}_${course.id}`
        const result = resultMap.get(key)
        const deadline = new Date(emp.startDate)
        deadline.setDate(deadline.getDate() + course.onboardingDeadlineDays)

        let status: 'ON_TIME' | 'LATE' | 'NOT_TRAINED' = 'NOT_TRAINED'
        let daysUsed: number | null = null

        if (result?.completedAt) {
          const completedDate = new Date(result.completedAt)
          daysUsed = Math.ceil((completedDate.getTime() - new Date(emp.startDate).getTime()) / (1000 * 60 * 60 * 24))
          status = completedDate <= deadline ? 'ON_TIME' : 'LATE'
        }

        return {
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          deadlineDays: course.onboardingDeadlineDays,
          deadline: deadline.toISOString(),
          completedAt: result?.completedAt?.toISOString() || null,
          source: result?.source || null,
          score: result?.score || null,
          status,
          daysUsed,
        }
      })

      // สถานะรวมของพนักงาน: ถ้ามีคอร์สไหนเลยที่ LATE → LATE, ถ้ายังไม่ครบ → NOT_TRAINED
      const overallStatus = courseResults.some(r => r.status === 'LATE')
        ? 'LATE'
        : courseResults.some(r => r.status === 'NOT_TRAINED')
          ? 'NOT_TRAINED'
          : 'ON_TIME'

      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        positionCode: emp.positionCode,
        positionLevel: emp.positionLevel,
        branchCode: emp.branchCode,
        branchName: emp.branch?.name || '-',
        isHeadOffice: emp.branch?.isHeadOffice || false,
        departmentCode: emp.departmentCode,
        startDate: emp.startDate.toISOString(),
        courseResults,
        overallStatus,
      }
    })

    // 6. Group by branch → คำนวณ KPI ต่อสาขา
    const branchGroups = new Map<string, typeof employeeDetails>()
    for (const emp of employeeDetails) {
      const key = emp.branchCode || 'NO_BRANCH'
      if (!branchGroups.has(key)) branchGroups.set(key, [])
      branchGroups.get(key)!.push(emp)
    }

    const branchSummaries = Array.from(branchGroups.entries()).map(([code, emps]) => {
      const totalEmployees = emps.length
      const trained = emps.filter(e => e.overallStatus !== 'NOT_TRAINED').length
      const onTime = emps.filter(e => e.overallStatus === 'ON_TIME').length
      const late = emps.filter(e => e.overallStatus === 'LATE').length
      const notTrained = emps.filter(e => e.overallStatus === 'NOT_TRAINED').length
      const trainedPercent = totalEmployees > 0 ? Math.round((trained / totalEmployees) * 100) : 0
      const kpiPassed = late === 0 && notTrained === 0 // ถ้ามี late แม้แต่ 1 คน = ตก KPI
      const branchName = emps[0]?.branchName || code
      const isHeadOffice = emps[0]?.isHeadOffice || false

      return {
        branchCode: code,
        branchName,
        isHeadOffice,
        totalEmployees,
        trained,
        onTime,
        late,
        notTrained,
        trainedPercent,
        kpiPassed,
      }
    }).sort((a, b) => a.branchCode.localeCompare(b.branchCode))

    const summary = {
      totalBranches: branchSummaries.length,
      passedBranches: branchSummaries.filter(b => b.kpiPassed).length,
      failedBranches: branchSummaries.filter(b => !b.kpiPassed).length,
    }

    return NextResponse.json({
      branches: branchSummaries,
      employees: employeeDetails,
      courses: mandatoryCourses,
      summary,
    })
  } catch (error: any) {
    console.error('[API] Onboarding report error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
