import * as XLSX from 'xlsx'

export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  // Create a new workbook
  const workbook = XLSX.utils.book_new()
  
  // Convert JSON to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  // Generate and download Excel file
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}
