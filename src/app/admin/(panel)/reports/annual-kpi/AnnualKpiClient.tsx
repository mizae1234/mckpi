'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LineChart, Calendar, RefreshCcw, Loader2, Download } from 'lucide-react'
import { exportToExcel } from '@/lib/exportExcel'

interface KpiMetric {
  kpiId: string
  kpiCode: string
  kpiName: string
  kpiTarget: string
  completionPercent: number
  passedCount: number
  requiredCount: number
}

interface BranchReport {
  branchId: string
  branchCode: string
  branchName: string
  employeeCount: number
  kpis: KpiMetric[]
}

interface ReportSummary {
  year: number
  totalBranches: number
  totalKpis: number
  kpiList: { id: string; code: string; name: string; courseCount: number }[]
}

export default function AnnualKpiClient({ initialYear, availableYears }: { initialYear: number, availableYears: number[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const yearParam = searchParams.get('year')
  const [selectedYear, setSelectedYear] = useState<number>(yearParam ? parseInt(yearParam) : initialYear)
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ summary: ReportSummary; branches: BranchReport[] } | null>(null)
  const [error, setError] = useState('')

  const fetchData = async (yearStr: number) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/reports/annual-kpi?year=${yearStr}`)
      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(selectedYear)
  }, [selectedYear])

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value)
    setSelectedYear(y)
    router.push(`/admin/reports/annual-kpi?year=${y}`)
  }

  const handleExport = () => {
    if (!data?.branches) return
    
    // แปลงข้อมูลให้อยู่ในรูป Flat JSON สำหรับตาราง Excel
    // แถว: สาขา, คอลัมน์: ชื่อ KPI
    const exportData = data.branches.map(b => {
      const row: any = {
        'รหัสสาขา': b.branchCode,
        'ชื่อสาขา': b.branchName,
        'จำนวนพนักงาน': b.employeeCount
      }
      
      b.kpis.forEach(k => {
         // รวมชื่อเพื่อให้อ่านง่าย เช่น "[KPI-001] ผ่าน 80%"
         row[`[${k.kpiCode}] ${k.kpiName}`] = k.requiredCount === 0 
           ? 'ไม่มีหลักสูตร'
           : `${k.completionPercent}% (${k.passedCount}/${k.requiredCount})`
      })
      
      return row
    })
    
    exportToExcel(exportData, `Annual_KPI_Report_${selectedYear}`)
  }

  const getPercentColor = (percent: number) => {
    if (percent >= 100) return 'text-emerald-600 bg-emerald-50'
    if (percent >= 80) return 'text-blue-600 bg-blue-50'
    if (percent >= 50) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LineChart className="w-6 h-6 text-primary" />
            รายงาน KPI ประจำปี {selectedYear}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
            แสดงเปอร์เซ็นต์พนักงานที่สอบผ่านหลักสูตรที่ผูกกับ KPI แยกรายสาขา
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-40">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select 
              value={selectedYear}
              onChange={handleYearChange}
              className="input-field pl-9 w-full font-medium"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>ปี {y}</option>
              ))}
            </select>
          </div>
          <button onClick={() => fetchData(selectedYear)} className="btn-secondary p-2" title="รีเฟรชข้อมูล">
            <RefreshCcw className="w-5 h-5 text-gray-600" />
          </button>
          {data?.branches && data.branches.length > 0 && (
             <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
               <Download className="w-4 h-4" />
               Export Excel
             </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-sm border border-[var(--color-border)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 font-medium text-gray-500">กำลังประมวลผลข้อมูลของทุกสาขา...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center shadow-sm">
          {error}
        </div>
      ) : data ? (
        <>
          {data.summary.totalKpis === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center border border-[var(--color-border)] shadow-sm">
              <LineChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-500">ยังไม่มี KPI ในปี {selectedYear}</h3>
              <p className="text-sm text-gray-400 mt-1">โปรดสร้าง KPI และผูกเข้ากับหลักสูตรในเมนู การจัดการ KPI</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 min-w-[200px] border-b border-gray-200">สาขา</th>
                      <th className="px-4 py-3 text-center border-b border-gray-200 w-24">พนักงาน</th>
                      {data.summary.kpiList.map(kpi => (
                        <th key={kpi.id} className="px-4 py-3 text-center border-b border-gray-200 border-l min-w-[140px]">
                          <div className="font-bold text-primary truncate" title={kpi.name}>{kpi.code}</div>
                          <div className="text-[10px] text-gray-400 font-normal mt-0.5 truncate">{kpi.name}</div>
                          <div className="text-[10px] text-blue-500 font-normal mt-0.5">({kpi.courseCount} Courses)</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.branches.map((branch, i) => (
                      <tr key={branch.branchId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[var(--color-text)]">{branch.branchName}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{branch.branchCode}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-gray-600 bg-gray-50">
                          {branch.employeeCount}
                        </td>
                        {branch.kpis.map(kpi => (
                          <td key={kpi.kpiId} className="px-4 py-3 text-center border-l border-gray-100">
                            {kpi.requiredCount === 0 ? (
                              <span className="text-xs text-gray-300">-</span>
                            ) : (
                              <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-bold ${getPercentColor(kpi.completionPercent)}`}>
                                {kpi.completionPercent}%
                              </div>
                            )}
                            {kpi.requiredCount > 0 && (
                               <div className="text-[10px] text-gray-400 mt-1 font-mono">
                                 {kpi.passedCount} / {kpi.requiredCount}
                               </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {data.branches.length === 0 && (
                      <tr>
                        <td colSpan={data.summary.totalKpis + 2} className="px-4 py-8 text-center text-gray-500">
                          ไม่พบข้อมูลสาขา
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
