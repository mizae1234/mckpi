import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // กำหนด Headers คอลัมน์ที่ต้องใช้
    const columns = [
      'รหัสพนักงาน',
      'ชื่อ-นามสกุล',
      'ตำแหน่ง',
      'แผนก',
      'สาขา',
      'วันเกิด (DD/MM/YYYY)',
      'วันเริ่มงาน (DD/MM/YYYY)'
    ]

    // ข้อมูลตัวอย่าง
    const dummyData = [
      ['EMP001', 'สมชาย ใจดี', 'พนักงานขาย', 'ฝ่ายขาย', '1 สาขาใหญ่', '15/04/1995', '01/10/2023'],
      ['EMP002', 'สมหญิง รักงาน', 'ผู้จัดการ', 'ฝ่ายบริหาร', '2 สาขา...', '20/08/1988', '15/05/2021']
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([columns, ...dummyData])

    // ตั้งค่าความกว้างคอลัมน์
    ws['!cols'] = [
      { wch: 15 }, // รหัสพนักงาน
      { wch: 25 }, // ชื่อ
      { wch: 20 }, // ตำแหน่ง
      { wch: 20 }, // แผนก
      { wch: 30 }, // สาขา
      { wch: 20 }, // วันเกิด
      { wch: 20 }, // วันเริ่มงาน
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Employees')

    // สร้าง Buffer เพื่อส่งกลับเป็นไฟล์ Download
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="employee_import_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (error) {
    console.error('[API] Template generation error:', error)
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
