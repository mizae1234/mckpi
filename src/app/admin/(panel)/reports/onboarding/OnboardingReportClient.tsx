'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2, Users, CheckCircle2, XCircle, Clock, AlertTriangle,
  Search, ChevronDown, ChevronUp, ArrowLeft, Filter, BarChart3,
  Calendar, TrendingUp, FileBarChart2, Download
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface CourseResult {
  courseId: string
  courseCode: string
  courseTitle: string
  deadlineDays: number
  deadline: string
  completedAt: string | null
  source: string | null
  score: number | null
  status: 'ON_TIME' | 'LATE' | 'NOT_TRAINED'
  daysUsed: number | null
}

interface EmployeeDetail {
  id: string
  employeeCode: string
  fullName: string
  positionCode: string | null
  positionLevel: number | null
  branchCode: string | null
  branchName: string
  isHeadOffice: boolean
  departmentCode: string | null
  startDate: string
  courseResults: CourseResult[]
  overallStatus: 'ON_TIME' | 'LATE' | 'NOT_TRAINED'
}

interface BranchSummary {
  branchCode: string
  branchName: string
  isHeadOffice: boolean
  totalEmployees: number
  trained: number
  onTime: number
  late: number
  notTrained: number
  trainedPercent: number
  kpiPassed: boolean
}

interface ReportData {
  branches: BranchSummary[]
  employees: EmployeeDetail[]
  courses: { id: string; code: string; title: string; onboardingDeadlineDays: number }[]
  summary: { totalBranches: number; passedBranches: number; failedBranches: number }
}

export default function OnboardingReportClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null)
  const [employeeSearch, setEmployeeSearch] = useState('')

  // Filters
  const [branchFilter, setBranchFilter] = useState(searchParams.get('branchCode') || '')
  const [courseFilter, setCourseFilter] = useState(searchParams.get('courseId') || '')
  const [startDateFrom, setStartDateFrom] = useState(searchParams.get('startDateFrom') || '')
  const [startDateTo, setStartDateTo] = useState(searchParams.get('startDateTo') || '')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (branchFilter) params.set('branchCode', branchFilter)
    if (courseFilter) params.set('courseId', courseFilter)
    if (startDateFrom) params.set('startDateFrom', startDateFrom)
    if (startDateTo) params.set('startDateTo', startDateTo)

    try {
      const res = await fetch(`/api/admin/reports/onboarding?${params.toString()}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [branchFilter, courseFilter, startDateFrom, startDateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (branchFilter) params.set('branchCode', branchFilter)
    if (courseFilter) params.set('courseId', courseFilter)
    if (startDateFrom) params.set('startDateFrom', startDateFrom)
    if (startDateTo) params.set('startDateTo', startDateTo)
    router.push(`/admin/reports/onboarding?${params.toString()}`)
    fetchData()
  }

  const handleReset = () => {
    setBranchFilter('')
    setCourseFilter('')
    setStartDateFrom('')
    setStartDateTo('')
    router.push('/admin/reports/onboarding')
  }

  const handleExportExcel = () => {
    if (!data) return
    
    // 1. Prepare Branch Summary Sheet
    const branchExportData = data.branches.map(b => ({
      'รหัสสาขา': b.branchCode,
      'ชื่อสาขา': b.branchName,
      'ประเภท': b.isHeadOffice ? 'Head Office' : 'สาขา',
      'พนักงานทั้งหมด': b.totalEmployees,
      'พนักงานที่ต้องอบรม': b.totalEmployees, // Can adjust based on logic
      'อบรมแล้ว': b.trained,
      'ทันเวลา': b.onTime,
      'เกินกำหนด': b.late,
      'ยังไม่อบรม': b.notTrained,
      '% อบรมแล้ว': `${b.trainedPercent}%`,
      'สถานะ KPI': b.kpiPassed ? 'ผ่าน' : 'ไม่ผ่าน'
    }))

    // 2. Prepare Employee Detail Sheet
    const employeeExportData = data.employees.map(emp => {
      // Assuming showing the first course result for simplicity in flat excel format
      const courseResult = emp.courseResults[0]
      let statusStr = ''
      switch (emp.overallStatus) {
        case 'ON_TIME': statusStr = 'ทันเวลา'; break;
        case 'LATE': statusStr = 'เกินกำหนด'; break;
        case 'NOT_TRAINED': statusStr = 'ยังไม่อบรม'; break;
      }
      
      let sourceStr = courseResult?.source || ''
      if (sourceStr === 'ONLINE') sourceStr = 'MKPI'
      else if (sourceStr === 'IMPORT') sourceStr = 'LMS Import'
      else if (sourceStr === 'OFFLINE') sourceStr = 'Classroom'

      return {
        'รหัสพนักงาน': emp.employeeCode,
        'ชื่อ-สกุล': emp.fullName,
        'สาขา': emp.branchName,
        'รหัสสาขา': emp.branchCode,
        'ตำแหน่ง': emp.positionCode || '',
        'Level': emp.positionLevel || '',
        'แผนก': emp.departmentCode || '',
        'วันเริ่มงาน': new Date(emp.startDate).toLocaleDateString('th-TH'),
        'หลักสูตร': courseResult ? courseResult.courseTitle : '',
        'กำหนดอบรม (วัน)': courseResult ? courseResult.deadlineDays : '',
        'กำหนดวันที่': courseResult ? new Date(courseResult.deadline).toLocaleDateString('th-TH') : '',
        'วันที่อบรม': courseResult?.completedAt ? new Date(courseResult.completedAt).toLocaleDateString('th-TH') : '',
        'ใช้เวลา (วัน)': courseResult?.daysUsed ?? '',
        'คะแนน': courseResult?.score ?? '',
        'ระบบที่ใช้อบรม': sourceStr,
        'สถานะการอบรม': statusStr,
      }
    })

    const wb = XLSX.utils.book_new()
    const wsBranch = XLSX.utils.json_to_sheet(branchExportData)
    const wsEmployee = XLSX.utils.json_to_sheet(employeeExportData)

    // Adjust column widths basic
    const maxBranchWidth = [{ wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
    wsBranch['!cols'] = maxBranchWidth

    const maxEmpWidth = [{ wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }]
    wsEmployee['!cols'] = maxEmpWidth

    XLSX.utils.book_append_sheet(wb, wsBranch, 'สรุปรายสาขา')
    XLSX.utils.book_append_sheet(wb, wsEmployee, 'รายละเอียดพนักงาน')

    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Onboarding_KPI_Report_${dateStr}.xlsx`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_TIME':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" />ทันเวลา</span>
      case 'LATE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700"><XCircle className="w-3 h-3" />เกินกำหนด</span>
      case 'NOT_TRAINED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />ยังไม่อบรม</span>
      default:
        return null
    }
  }

  const getSourceBadge = (source: string | null) => {
    if (!source) return null
    switch (source) {
      case 'ONLINE': return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">MKPI</span>
      case 'IMPORT': return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">LMS Import</span>
      case 'OFFLINE': return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">Classroom</span>
      default: return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">{source}</span>
    }
  }

  // Branch list for filter dropdown
  const allBranches = data?.branches || []

  // Client-side search by employee code / name / position
  const filteredEmployees = useMemo(() => {
    const rawEmployees = data?.employees || []
    if (!employeeSearch.trim()) return rawEmployees
    const q = employeeSearch.toLowerCase()
    return rawEmployees.filter(e =>
      e.employeeCode.toLowerCase().includes(q) ||
      e.fullName.toLowerCase().includes(q) ||
      (e.positionCode || '').toLowerCase().includes(q)
    )
  }, [data?.employees, employeeSearch])

  // Limit branches to those that have at least 1 matching employee when searching
  const filteredBranches = useMemo(() => {
    const rawBranches = data?.branches || []
    if (!employeeSearch.trim()) return rawBranches
    const matchingCodes = new Set(filteredEmployees.map(e => e.branchCode || 'NO_BRANCH'))
    return rawBranches.filter(b => matchingCodes.has(b.branchCode))
  }, [data?.branches, filteredEmployees, employeeSearch])

  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <form onSubmit={handleSearch} className="stat-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            ตัวกรองรายงาน
          </h3>
          <button type="button" onClick={handleReset} className="btn-secondary text-sm px-3 py-1.5">ล้างค่า</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">สาขา</label>
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="input-field text-sm py-2">
              <option value="">-- ทุกสาขา --</option>
              {allBranches.map(b => (
                <option key={b.branchCode} value={b.branchCode}>{b.branchName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">หลักสูตร</label>
            <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className="input-field text-sm py-2">
              <option value="">-- ทุกหลักสูตรบังคับ --</option>
              {data?.courses?.map(c => (
                <option key={c.id} value={c.id}>[{c.code}] {c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">เริ่มงานตั้งแต่</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="date" value={startDateFrom} onChange={e => setStartDateFrom(e.target.value)} className="input-field pl-9 text-sm py-2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">ถึงวันที่</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="date" value={startDateTo} onChange={e => setStartDateTo(e.target.value)} className="input-field pl-9 text-sm py-2" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary px-6 py-2">
            <Search className="w-4 h-4" />
            ค้นหา
          </button>
          
          {data && (
            <button 
              type="button" 
              onClick={handleExportExcel}
              className="btn-secondary px-4 py-2 flex items-center gap-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          )}
        </div>
      </form>

      {/* Employee Search Bar */}
      {data && (
        <div className="stat-card px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={employeeSearch}
                onChange={e => { setEmployeeSearch(e.target.value); setExpandedBranch(null) }}
                placeholder="ค้นหาพนักงาน: รหัสพนักงาน, ชื่อสกุล, ตำแหน่ง..."
                className="w-full pl-10 pr-10 py-2 text-sm border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-gray-400"
              />
              {employeeSearch && (
                <button
                  type="button"
                  onClick={() => { setEmployeeSearch(''); setExpandedBranch(null) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            {employeeSearch && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                พบ <span className="font-bold text-primary">{filteredEmployees.length}</span> คน, <span className="font-bold text-primary">{filteredBranches.length}</span> สาขา
              </span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (() => {
        const summary = data.summary || { totalBranches: 0, passedBranches: 0, failedBranches: 0 }
        const branches = employeeSearch.trim() ? filteredBranches : (data.branches || [])
        const employees = filteredEmployees
        return (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">สาขาทั้งหมด</span>
              </div>
              <div className="text-3xl font-bold text-[var(--color-text)]">{summary.totalBranches}</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">ผ่าน KPI</span>
              </div>
              <div className="text-3xl font-bold text-emerald-600">{summary.passedBranches}</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">ไม่ผ่าน KPI</span>
              </div>
              <div className="text-3xl font-bold text-red-600">{summary.failedBranches}</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">อัตราผ่าน</span>
              </div>
              <div className="text-3xl font-bold text-[var(--color-text)]">
                {summary.totalBranches > 0 ? Math.round((summary.passedBranches / summary.totalBranches) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Branch Table with Expandable Detail */}
          <div className="stat-card overflow-hidden">
            <div className="p-5 border-b border-[var(--color-border)]">
              <h2 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                สรุป KPI รายสาขา
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">คลิกที่แถวเพื่อดูรายละเอียดพนักงาน</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-left text-xs text-gray-500 font-semibold">
                    <th className="px-5 py-3 w-8"></th>
                    <th className="px-5 py-3">สาขา</th>
                    <th className="px-5 py-3 text-center">ประเภท</th>
                    <th className="px-5 py-3 text-center">พนักงาน</th>
                    <th className="px-5 py-3 text-center">อบรมแล้ว</th>
                    <th className="px-5 py-3 text-center">ทันเวลา</th>
                    <th className="px-5 py-3 text-center">เกินกำหนด</th>
                    <th className="px-5 py-3 text-center">ยังไม่อบรม</th>
                    <th className="px-5 py-3 text-center">% อบรม</th>
                    <th className="px-5 py-3 text-center">สถานะ KPI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-gray-400">
                        <FileBarChart2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  ) : (
                    branches.map(branch => {
                      const isExpanded = expandedBranch === branch.branchCode
                      const branchEmployees = employees.filter(e => (e.branchCode || 'NO_BRANCH') === branch.branchCode)

                      return (
                        <BranchRow
                          key={branch.branchCode}
                          branch={branch}
                          isExpanded={isExpanded}
                          onToggle={() => setExpandedBranch(isExpanded ? null : branch.branchCode)}
                          employees={branchEmployees}
                          getStatusBadge={getStatusBadge}
                          getSourceBadge={getSourceBadge}
                        />
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
        )
      })() : null}
    </div>
  )
}

function BranchRow({
  branch,
  isExpanded,
  onToggle,
  employees,
  getStatusBadge,
  getSourceBadge,
}: {
  branch: BranchSummary
  isExpanded: boolean
  onToggle: () => void
  employees: EmployeeDetail[]
  getStatusBadge: (status: string) => React.ReactNode
  getSourceBadge: (source: string | null) => React.ReactNode
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
      >
        <td className="px-5 py-3">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </td>
        <td className="px-5 py-3">
          <div className="font-medium text-[var(--color-text)]">{branch.branchName}</div>
          <div className="text-xs text-gray-400 font-mono">{branch.branchCode}</div>
        </td>
        <td className="px-5 py-3 text-center">
          {branch.isHeadOffice ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">Head Office</span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">สาขา</span>
          )}
        </td>
        <td className="px-5 py-3 text-center">
          <span className="font-bold text-[var(--color-text)]">{branch.totalEmployees}</span>
        </td>
        <td className="px-5 py-3 text-center font-semibold text-blue-600">{branch.trained}</td>
        <td className="px-5 py-3 text-center font-semibold text-emerald-600">{branch.onTime}</td>
        <td className="px-5 py-3 text-center font-semibold text-red-600">{branch.late > 0 ? branch.late : '-'}</td>
        <td className="px-5 py-3 text-center font-semibold text-amber-600">{branch.notTrained > 0 ? branch.notTrained : '-'}</td>
        <td className="px-5 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${branch.trainedPercent >= 100 ? 'bg-emerald-500' : branch.trainedPercent >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                style={{ width: `${branch.trainedPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-600">{branch.trainedPercent}%</span>
          </div>
        </td>
        <td className="px-5 py-3 text-center">
          {branch.kpiPassed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> ผ่าน
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              <XCircle className="w-3.5 h-3.5" /> ไม่ผ่าน
            </span>
          )}
        </td>
      </tr>

      {/* Expanded Detail */}
      {isExpanded && (
        <tr>
          <td colSpan={10} className="px-0 py-0">
            <div className="bg-blue-50/30 border-y border-blue-100">
              <div className="px-6 py-3 flex items-center gap-2 border-b border-blue-100/50">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-[var(--color-text)]">รายละเอียดพนักงาน — {branch.branchName}</span>
                <span className="text-xs text-gray-500">({employees.length} คน)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 font-semibold bg-white/50">
                      <th className="px-6 py-2">รหัส</th>
                      <th className="px-6 py-2">ชื่อ-สกุล</th>
                      <th className="px-6 py-2">ตำแหน่ง</th>
                      <th className="px-6 py-2">Level</th>
                      <th className="px-6 py-2">วันเริ่มงาน</th>
                      <th className="px-6 py-2">กำหนด</th>
                      <th className="px-6 py-2">วันที่อบรม</th>
                      <th className="px-6 py-2">ใช้เวลา</th>
                      <th className="px-6 py-2">แหล่งที่มา</th>
                      <th className="px-6 py-2">คะแนน</th>
                      <th className="px-6 py-2">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50">
                    {employees.map(emp => {
                      // ใช้ course result แรก
                      const cr = emp.courseResults[0]
                      return (
                        <tr key={emp.id} className="hover:bg-white/60 transition-colors">
                          <td className="px-6 py-2 font-mono font-semibold text-primary text-xs">{emp.employeeCode}</td>
                          <td className="px-6 py-2 font-medium">{emp.fullName}</td>
                          <td className="px-6 py-2 text-gray-600">{emp.positionCode || '-'}</td>
                          <td className="px-6 py-2 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                              Lv.{emp.positionLevel || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-2 text-gray-600">{new Date(emp.startDate).toLocaleDateString('th-TH')}</td>
                          <td className="px-6 py-2 text-gray-600">{cr ? new Date(cr.deadline).toLocaleDateString('th-TH') : '-'}</td>
                          <td className="px-6 py-2 text-gray-600">{cr?.completedAt ? new Date(cr.completedAt).toLocaleDateString('th-TH') : '-'}</td>
                          <td className="px-6 py-2 text-center">
                            {cr?.daysUsed != null ? (
                              <span className={`font-mono font-bold text-xs ${cr.status === 'LATE' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {cr.daysUsed} วัน
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-2">{getSourceBadge(cr?.source || null)}</td>
                          <td className="px-6 py-2 font-mono font-semibold">{cr?.score != null ? `${cr.score}%` : '-'}</td>
                          <td className="px-6 py-2">{getStatusBadge(emp.overallStatus)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
