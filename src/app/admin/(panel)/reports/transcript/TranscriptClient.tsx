'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircle, Search, Clock, Award, BookOpen, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

import { exportToExcel } from '@/lib/exportExcel'

export default function TranscriptClient({ initialEmployeeId }: { initialEmployeeId: string }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialEmployeeId) {
      fetchTranscript(initialEmployeeId)
    }
  }, [initialEmployeeId])

  const searchEmployees = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/admin/reports/transcript?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setSearchResults(json.employees || [])
      setShowDropdown(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const fetchTranscript = async (empId: string) => {
    setLoading(true)
    setError('')
    setShowDropdown(false)
    setSearchQuery('')
    
    // Update URL without reload
    router.replace(`/admin/reports/transcript?id=${empId}`, { scroll: false })

    try {
      const res = await fetch(`/api/admin/reports/transcript?employeeId=${empId}`)
      if (!res.ok) throw new Error('ไม่พบข้อมูลประวัติการอบรมพนักงานรายนี้ / เกิดข้อผิดพลาด')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (err: any) {
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!data?.employee?.results) return
    const exportData = data.employee.results.map((r: any) => ({
      'รหัสพนักงาน': data.employee.employeeCode,
      'ชื่อ-นามสกุล': data.employee.fullName,
      'สาขา': data.employee.branchCode,
      'ตำแหน่ง': data.employee.positionCode,
      'รหัสหลักสูตร': r.course.code,
      'ชื่อหลักสูตร': r.course.title,
      'ประเภท': r.course.trainingType,
      'ชั่วโมงอบรม': r.course.creditHours,
      'ที่มา': r.source,
      'คะแนน': r.score !== null ? `${r.score}%` : '-',
      'สถานะ': r.status,
      'วันที่สำเร็จ': r.completedAt ? new Date(r.completedAt).toLocaleDateString('th-TH') : '-'
    }))
    exportToExcel(exportData, `Transcript_${data.employee.employeeCode}`, 'Transcript')
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ONLINE': return <span className="badge bg-blue-100 text-blue-700">Online</span>
      case 'OFFLINE': return <span className="badge bg-green-100 text-green-700">Classroom</span>
      case 'IMPORT': return <span className="badge bg-gray-100 text-gray-700 border border-gray-300">Import</span>
      case 'EXTERNAL': return <span className="badge bg-purple-100 text-purple-700">External</span>
      default: return <span className="badge bg-gray-100 text-gray-600">{source}</span>
    }
  }

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'PASSED': return <div className="text-emerald-600 font-bold flex items-center gap-1 justify-center"><CheckCircle2 className="w-4 h-4"/> ผ่าน</div>
      case 'FAILED': return <div className="text-red-500 font-bold flex items-center gap-1 justify-center"><XCircle className="w-4 h-4"/> ไม่ผ่าน</div>
      default: return <div className="text-amber-500 font-bold flex items-center gap-1 justify-center"><Clock className="w-4 h-4"/> กำลังเรียน</div>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Search */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCircle className="w-6 h-6 text-primary" />
            ประวัติการอบรม (Employee Transcript)
          </h1>
          {data && (
            <button onClick={handleExport} className="btn-secondary whitespace-nowrap">
              Export Excel
            </button>
          )}
        </div>
        
        <div className="relative max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => searchEmployees(e.target.value)}
              placeholder="ค้นหาด้วย รหัสพนักงาน, ชื่อ-นามสกุล หรือ รหัสสาขา..."
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
              <ul className="divide-y divide-gray-100">
                {searchResults.map(emp => (
                  <li 
                    key={emp.id} 
                    onClick={() => fetchTranscript(emp.id)}
                    className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-[var(--color-text)]">
                      {emp.employeeCode} : {emp.fullName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      สาขา: {emp.branchCode} | ตำแหน่ง: {emp.positionCode}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12 bg-white rounded-2xl shadow-sm border border-[var(--color-border)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 font-medium text-gray-500">กำลังดึงข้อมูล...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-bold">เกิดข้อผิดพลาด</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Employee Profile Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-indigo-100 text-indigo-500 shrink-0">
              <UserCircle className="w-10 h-10" />
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">รหัส และ ชื่อพนักงาน</div>
                <div className="font-bold text-lg">{data.employee.employeeCode}</div>
                <div className="font-medium text-gray-700">{data.employee.fullName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">สาขา / ตำแหน่ง</div>
                <div className="font-bold">{data.employee.branchCode}</div>
                <div className="font-medium text-gray-700">{data.employee.positionCode}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">วันเริ่มงาน</div>
                <div className="font-bold">
                  {data.employee.startDate ? new Date(data.employee.startDate).toLocaleDateString('th-TH') : '-'}
                </div>
              </div>
              <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-md text-center">
                <div className="text-xs text-indigo-100 mb-1">ชั่วโมงอบรมรวมสะสม (ผ่าน)</div>
                <div className="font-bold text-2xl flex items-center justify-center gap-2">
                  <Award className="w-5 h-5" />
                  {data.totalCreditHours} ชม.
                </div>
              </div>
            </div>
          </div>

          {/* Transcript Table */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-bold">ประวัติการอบรมทั้งหมด ({data.employee.results?.length || 0} รายการ)</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-gray-500">
                  <tr>
                    <th className="px-4 py-3 border-b">รหัสหลักสูตร</th>
                    <th className="px-4 py-3 border-b">ชื่อหลักสูตร</th>
                    <th className="px-4 py-3 border-b">ที่มา</th>
                    <th className="px-4 py-3 border-b text-center">คะแนน</th>
                    <th className="px-4 py-3 border-b text-center">สถานะ</th>
                    <th className="px-4 py-3 border-b">วันที่สำเร็จ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.employee.results?.length > 0 ? (
                    data.employee.results.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-gray-600">
                          {r.course.code}
                          {r.course.isMandatory && <div className="text-[10px] bg-red-100 text-red-600 px-1 py-[1px] rounded inline-block ml-2">บังคับ</div>}
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                          {r.course.title}
                          <div className="text-xs text-gray-400 mt-0.5">{r.course.creditHours} ชั่วโมง</div>
                        </td>
                        <td className="px-4 py-3">
                          {getSourceBadge(r.source)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-700">
                          {r.score !== null ? `${r.score}%` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusDisplay(r.status)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {r.completedAt ? new Date(r.completedAt).toLocaleDateString('th-TH') : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        ไม่พบประวัติการอบรม
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
