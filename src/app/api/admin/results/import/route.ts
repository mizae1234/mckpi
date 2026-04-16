import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import * as xlsx from 'xlsx'
import { ResultStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Read the file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Parse the Excel file
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    
    // Parse into JSON format mapping headers correctly
    const rawData = xlsx.utils.sheet_to_json(sheet) as any[]
    
    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ error: 'The Excel file is empty' }, { status: 400 })
    }

    // Fetch master dictionaries for mapping Codes -> IDs
    const allEmployees = await prisma.employee.findMany({ select: { id: true, employeeCode: true } })
    const allCourses = await prisma.course.findMany({ select: { id: true, code: true } })

    const empMap = new Map(allEmployees.map(e => [e.employeeCode, e.id]))
    const courseMap = new Map(allCourses.map(c => [c.code, c.id]))

    let importedCount = 0
    const errors: string[] = []

    // Process each row
    const operations = []

    for (let i = 0; i < rawData.length; i++) {
       const row = rawData[i]
       const rowNum = i + 2 // Assuming row 1 is header

       // Clean and extract fields based on exact header text from Export
       const empCode = row['รหัสพนักงาน']?.toString().trim()
       const courseCode = row['รหัสหลักสูตร']?.toString().trim()
       
       if (!empCode || !courseCode || empCode === '-' || courseCode === '-') {
         continue // Skip empty or invalid lines
       }

       const employeeId = empMap.get(empCode)
       const courseId = courseMap.get(courseCode)

       if (!employeeId) {
         errors.push(`Row ${rowNum}: รหัสพนักงาน ${empCode} ไม่พบในระบบ`)
         continue
       }
       if (!courseId) {
         errors.push(`Row ${rowNum}: รหัสหลักสูตร ${courseCode} ไม่พบในระบบ`)
         continue
       }

       // Parse status
       const statusStr = row['สถานะ']?.toString().trim()
       let status: ResultStatus = 'IN_PROGRESS'
       if (statusStr === 'ผ่าน') status = 'PASSED'
       if (statusStr === 'ไม่ผ่าน') status = 'FAILED'

       // Parse scores (can be string or number or empty)
       const parseScore = (val: any) => {
         if (!val || val === '-') return null
         const parsed = parseFloat(val)
         return isNaN(parsed) ? null : parsed
       }

       const score = parseScore(row['คะแนนแบบทดสอบ'])
       const pretestScore = parseScore(row['คะแนน Pretest'])
       const posttestScore = parseScore(row['คะแนน Posttest'])

       // Parse CompletedAt Date — รองรับทั้ง ค.ศ. และ พ.ศ.
       let completedAt: Date | null = null
       const rawDate = row['วันที่สำเร็จ']
       if (rawDate && rawDate !== '-') {
          if (typeof rawDate === 'number') {
            // Excel serial date → JS Date (ค.ศ.)
            completedAt = new Date((rawDate - 25569) * 86400 * 1000)
          } else {
            const dateStr = rawDate.toString().trim()
            let parsed: Date | null = null

            // รูปแบบ D/M/YYYY หรือ DD/MM/YYYY (รองรับ พ.ศ. และ ค.ศ.)
            const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
            if (slashMatch) {
              let year = parseInt(slashMatch[3])
              const month = parseInt(slashMatch[2])
              const day = parseInt(slashMatch[1])
              if (year >= 2400) year -= 543 // แปลง พ.ศ. → ค.ศ.
              parsed = new Date(Date.UTC(year, month - 1, day))
            }

            // รูปแบบ YYYY-MM-DD (รองรับ พ.ศ. และ ค.ศ.)
            if (!parsed) {
              const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
              if (isoMatch) {
                let year = parseInt(isoMatch[1])
                const month = parseInt(isoMatch[2])
                const day = parseInt(isoMatch[3])
                if (year >= 2400) year -= 543 // แปลง พ.ศ. → ค.ศ.
                parsed = new Date(Date.UTC(year, month - 1, day))
              }
            }

            // fallback: try standard parse
            if (!parsed) {
              const d = new Date(dateStr)
              if (!isNaN(d.getTime())) parsed = d
            }

            if (parsed && !isNaN(parsed.getTime())) completedAt = parsed
          }
       }

       // Map to Prisma transaction execution queue (Upsert by Unique KEY: employee_course_source)
       operations.push(
         prisma.trainingResult.upsert({
           where: {
             employeeId_courseId_source: {
               employeeId,
               courseId,
               source: 'IMPORT'
             }
           },
           update: {
             status,
             score,
             pretestScore,
             posttestScore,
             completedAt
           },
           create: {
             employeeId,
             courseId,
             source: 'IMPORT',
             status,
             score,
             pretestScore,
             posttestScore,
             completedAt
           }
         })
       )
       importedCount++
    }

    // Execute batch
    if (operations.length > 0) {
      await prisma.$transaction(operations)
    }

    return NextResponse.json({ 
      success: true, 
      importedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('[API] Validation / Import results error:', error)
    return NextResponse.json({ error: error.message || 'Internal import error' }, { status: 500 })
  }
}
