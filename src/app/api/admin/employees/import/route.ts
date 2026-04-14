import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import bcrypt from 'bcryptjs'
import { authMiddleware } from '@/lib/auth-edge'

// Helper to reliably parse DD/MM/YYYY or EXCEL serial dates
function parseExcelDate(dateVal: any): Date | null {
  if (!dateVal) return null

  // If Excel parsed it as a number (serial date)
  if (typeof dateVal === 'number') {
    const excelEpoch = new Date(1899, 11, 30) // Excel bug: 1900 is technically not a leap year in JS but is in excel
    // Math.round to avoid timezone drift issues
    return new Date(excelEpoch.getTime() + Math.round(dateVal * 86400000))
  }

  // If it's a string like DD/MM/YYYY
  const str = String(dateVal).trim()
  const parts = str.split(/[/.-]/)
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts
    const d = parseInt(dd, 10)
    const m = parseInt(mm, 10) - 1
    const y = parseInt(yyyy, 10)
    const fully = y < 100 ? y + 2000 : y // Handle short years just in case
    return new Date(fully, m, d)
  }

  return null
}

export const POST = authMiddleware(async (request: NextRequest) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Parse the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Read raw values first to try handling dates manually
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'ไฟล์ Excel ว่างเปล่า' }, { status: 400 })
    }

    let createdCount = 0
    let updatedCount = 0
    let failedCount = 0
    const errors: string[] = []

    // Cache mandatory courses once
    const mandatoryCourses = await prisma.course.findMany({
      where: { isMandatory: true, status: 'PUBLISHED' }
    })

    // Transaction is risky here because we need to parse rows and if one row fails we don't want the whole batch to rollback.
    // Instead, we will process sequentially and report failures per-row.
    
    for (const [index, row] of jsonData.entries()) {
      const rowNum = index + 2 // Because index 0 is row 2
      
      const empCodeRaw = row['รหัสพนักงาน'] || row['EmployeeCode'] || row['Code'] || row['รหัส']
      const fullName = row['ชื่อ-นามสกุล'] || row['ชื่อ'] || row['Name'] || row['FullName']
      const position = row['ตำแหน่ง'] || row['Position'] || ''
      const department = row['แผนก'] || row['Department'] || ''
      const branchRaw = row['สาขา'] || row['Branch'] || ''
      
      const dobRaw = row['วันเกิด (DD/MM/YYYY)'] || row['วันเกิด'] || row['DOB']
      const startDateRaw = row['วันเริ่มงาน (DD/MM/YYYY)'] || row['วันเริ่มงาน'] || row['StartDate']

      if (!empCodeRaw) {
        failedCount++
        errors.push(`Row ${rowNum}: ขาดรหัสพนักงาน / ไม่ได้ระบุรหัสพนักงาน`)
        continue
      }

      const employeeCode = String(empCodeRaw).trim().toUpperCase()

      let branchCode: string | null = null
      if (branchRaw) {
        const branchInput = String(branchRaw).trim()
        
        let branch = await prisma.branch.findFirst({ 
          where: { 
            OR: [
              { code: branchInput },
              { name: branchInput }
            ]
          } 
        })
        
        if (!branch) {
          branch = await prisma.branch.create({
            data: {
              code: branchInput,
              name: branchInput
            }
          })
        }
        branchCode = branch.code
      }

      // Look up existing employee
      const existingEmployee = await prisma.employee.findUnique({
        where: { employeeCode: employeeCode }
      })

      if (existingEmployee) {
        // Update existing branch and position
        try {
          await prisma.employee.update({
            where: { id: existingEmployee.id },
            data: {
              fullName: fullName ? String(fullName) : existingEmployee.fullName,
              positionCode: position ? String(position) : existingEmployee.positionCode,
              departmentCode: department ? String(department) : existingEmployee.departmentCode,
              branchCode: branchCode !== null ? branchCode : existingEmployee.branchCode,
            }
          })
          updatedCount++
        } catch (e) {
          failedCount++
          errors.push(`Row ${rowNum}: แก้ไขไม่ได้ (${employeeCode})`)
        }
      } else {
        // Create new employee
        if (!fullName || !dobRaw) {
          failedCount++
          errors.push(`Row ${rowNum}: พนักงานใหม่จำเป็นต้องระบุชื่อและวันเกิด (${employeeCode})`)
          continue
        }

        const dob = parseExcelDate(dobRaw)
        const startDate = parseExcelDate(startDateRaw)

        if (!dob || isNaN(dob.getTime())) {
          failedCount++
          errors.push(`Row ${rowNum}: รูปแบบวันเกิดไม่ถูกต้อง โปรดใช้ DD/MM/YYYY (${employeeCode})`)
          continue
        }

        try {
          // Generate password from DOB (DDMMYYYY)
          const dd = String(dob.getDate()).padStart(2, '0')
          const mm = String(dob.getMonth() + 1).padStart(2, '0')
          const yyyy = String(dob.getFullYear())
          const defaultPassword = `${dd}${mm}${yyyy}`
          const passwordHash = await bcrypt.hash(defaultPassword, 10)

          const actualStartDate = startDate && !isNaN(startDate.getTime()) ? startDate : new Date()

          const newEmployee = await prisma.employee.create({
            data: {
              employeeCode: employeeCode,
              fullName: String(fullName),
              passwordHash: passwordHash,
              positionCode: String(position),
              departmentCode: String(department),
              branchCode: branchCode,
              dateOfBirth: dob,
              startDate: actualStartDate,
            }
          })

          // Auto-assign mandatory courses
          if (mandatoryCourses.length > 0) {
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
            const dueDate = new Date(newEmployee.startDate.getTime() + thirtyDaysMs)

            await prisma.courseAssignment.createMany({
              data: mandatoryCourses.map(c => ({
                employeeId: newEmployee.id,
                courseId: c.id,
                dueDate: dueDate,
              }))
            })
          }

          createdCount++
        } catch (e: any) {
          failedCount++
          errors.push(`Row ${rowNum}: เพิ่มไม่ได้ (${employeeCode}) - ${e.message?.slice(0,50)}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: createdCount,
      updated: updatedCount,
      failed: failedCount,
      total: jsonData.length,
      errors: errors.slice(0, 50) // Cap to prevent massive payloads
    })

  } catch (error) {
    console.error('[API] Employee import error:', error)
    return NextResponse.json({ error: 'Internal server error while parsing file' }, { status: 500 })
  }
}) as any
