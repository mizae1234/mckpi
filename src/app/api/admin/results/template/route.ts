import { NextResponse } from 'next/server'
import * as xlsx from 'xlsx'

export async function GET() {
  try {
    const headers = [
      'รหัสพนักงาน', 
      'รหัสหลักสูตร', 
      'สถานะ', 
      'วันที่สำเร็จ', 
      'คะแนน Pretest', 
      'คะแนน Posttest', 
      'คะแนนแบบทดสอบ'
    ]

    // Create a worksheet with just the headers
    const worksheet = xlsx.utils.aoa_to_sheet([headers])
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Import_Template')

    // Generate buffer
    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="training_results_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (error: any) {
    console.error('[API] Download Template error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
