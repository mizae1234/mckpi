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
    const yearStr = searchParams.get('year')
    const currentYear = new Date().getFullYear()
    const targetYear = yearStr ? parseInt(yearStr) : currentYear

    // 1. ดึง KPI ทั้งหมดในปีที่กำหนด พร้อมหลักสูตรที่ผูกไว้
    const kpis = await prisma.kpi.findMany({
      where: { year: targetYear },
      include: {
        courses: {
          include: {
            course: {
              select: { id: true, title: true }
            }
          }
        }
      },
      orderBy: { code: 'asc' }
    })

    // 2. ดึงสาขาทั้งหมด พร้อมพนักงาน
    const branches = await prisma.branch.findMany({
      include: {
        employees: {
          select: { id: true }
        }
      },
      orderBy: { code: 'asc' }
    })

    // 3. ดึงผลการอบรม (TrainingResult) เฉพาะที่เกี่ยวข้องกับ KPI ในปีนี้
    // เราต้องการเฉพาะ PASSED เพื่อนำมานับ %
    const courseIds = kpis.flatMap(k => k.courses.map(kc => kc.courseId))
    
    // ดึง training results ที่ผ่านแล้ว สำหรับคอร์สที่เกี่ยวข้อง
    const passedResults = await prisma.trainingResult.findMany({
      where: {
        courseId: { in: courseIds },
        status: 'PASSED' // นับเฉพาะคนที่สอบผ่านแล้ว
      },
      select: {
        employeeId: true,
        courseId: true
      }
    })

    // จัดกลุ่ม results ตาม employeeId เพื่อให้เข้าถึงง่าย
    const employeePassedCourses: Record<string, Set<string>> = {}
    passedResults.forEach(r => {
      if (!employeePassedCourses[r.employeeId]) {
        employeePassedCourses[r.employeeId] = new Set()
      }
      employeePassedCourses[r.employeeId].add(r.courseId)
    })

    // 4. คำนวณ % การผ่านของแต่ละสาขา ต่อ KPI
    // Logic: 
    // สาขา A มีพนักงาน 10 คน
    // KPI X มีคอร์สผูกไว้ 2 คอร์ส
    // เป้าหมายของสาขา A สำหรับ KPI X คือ ต้องมีคนสอบผ่าน 10 * 2 = 20 คอร์ส
    // ถ้าพนักงานสอบผ่านรวมกัน 15 คอร์ส -> คิดเป็น 75%
    
    const reportData = branches.map(branch => {
      const branchEmployees = branch.employees.map(e => e.id)
      const empCount = branchEmployees.length

      const kpiScores = kpis.map(kpi => {
        const requiredCourseIds = kpi.courses.map(kc => kc.courseId)
        const totalRequiredCourses = empCount * requiredCourseIds.length
        
        let totalPassedCourses = 0

        // ถ้าไม่มีหลักสูตรผูกไว้เลย หรือไม่มีพนักงานเลย
        if (totalRequiredCourses === 0) {
          return {
            kpiId: kpi.id,
            kpiCode: kpi.code,
            kpiName: kpi.name,
            kpiTarget: kpi.target,
            completionPercent: 0,
            passedCount: 0,
            requiredCount: 0
          }
        }

        // นับจำนวนคอร์สที่พนักงานในสาขานี้สอบผ่าน (เฉพาะกลุ่มคอร์สของ KPI นี้)
        branchEmployees.forEach(empId => {
          const empPassed = employeePassedCourses[empId]
          if (empPassed) {
            requiredCourseIds.forEach(courseId => {
              if (empPassed.has(courseId)) {
                totalPassedCourses++
              }
            })
          }
        })

        const completionPercent = Math.round((totalPassedCourses / totalRequiredCourses) * 100)

        return {
          kpiId: kpi.id,
          kpiCode: kpi.code,
          kpiName: kpi.name,
          kpiTarget: kpi.target,
          completionPercent,
          passedCount: totalPassedCourses,
          requiredCount: totalRequiredCourses
        }
      })

      return {
        branchId: branch.id,
        branchCode: branch.code,
        branchName: branch.name,
        employeeCount: empCount,
        kpis: kpiScores
      }
    })

    // สรุปข้อมูลทั้งหมด
    const summary = {
      year: targetYear,
      totalBranches: branches.length,
      totalKpis: kpis.length,
      kpiList: kpis.map(k => ({
        id: k.id,
        code: k.code,
        name: k.name,
        courseCount: k.courses.length
      }))
    }

    return NextResponse.json({ summary, branches: reportData })
    
  } catch (error: any) {
    console.error('Annual KPI Report Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
