'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, CheckCircle2, XCircle, AlertTriangle, Clock, BookOpen, Download } from 'lucide-react'
import { exportToExcel } from '@/lib/exportExcel'

// ข้อมูลหลักสูตรที่ดึงมาเพื่อให้เลือกใน dropdown
interface CourseOption {
  id: string
  code: string
  title: string
  isMandatory: boolean
}

export default function CourseAnalyticsClient() {
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  // 1. ดึงข้อมูลหลักสูตรทั้งหมดตอนเปิดหน้า
  useEffect(() => {
    fetch('/api/admin/reports/courses')
      .then(res => res.json())
      .then(json => {
        if (json.courses) {
          setCourses(json.courses)
          if (json.courses.length > 0) {
            setSelectedCourseId(json.courses[0].id)
          }
        }
      })
      .catch(console.error)
  }, [])

  // 2. ดึงสถิติเมื่อเลือกหลักสูตร
  useEffect(() => {
    if (!selectedCourseId) return
    
    setLoading(true)
    setError('')
    setData(null)

    fetch(`/api/admin/reports/courses?courseId=${selectedCourseId}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setData(json)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

  }, [selectedCourseId])

  const handleExportMissing = () => {
    if (!data?.missingEmployees) return
    
    const exportData = data.missingEmployees.map((emp: any) => ({
      'รหัสพนักงาน': emp.employeeCode,
      'ชื่อ-นามสกุล': emp.fullName,
      'สาขา': emp.branchCode,
      'ตำแหน่ง': emp.positionCode,
      'วันที่เริ่มงาน': emp.startDate ? new Date(emp.startDate).toLocaleDateString('th-TH') : '',
      'อายุงาน (วัน)': emp.daysSinceStart,
      'สถานะการอบรม': !data.course.hasDeadline 
        ? 'ยังไม่ได้อบรม' 
        : (emp.isOverdue ? 'ล่าช้าเกินกำหนด' : 'ยังไม่ครบกำหนด')
    }))
    
    exportToExcel(exportData, `รายชื่อผู้ค้างอบรม_${data.course.code}`, 'Missing List')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            สถิติหลักสูตร (Course Analytics)
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
            เลือกหลักสูตรเพื่อดูอัตราการสอบผ่าน คะแนนเฉลี่ย และรายชื่อผู้ยังไม่อบรม
          </p>
        </div>

        <div className="w-full md:w-[400px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">เลือกหลักสูตร</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select 
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="input-field pl-9 w-full shadow-sm bg-gray-50 font-medium"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.title} {c.isMandatory ? '(บังคับ)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-sm border border-[var(--color-border)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 font-medium text-gray-500">กำลังวิเคราะห์ข้อมูล...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" />
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border hover:border-indigo-300 border-[var(--color-border)] p-5 rounded-2xl shadow-sm transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="text-gray-500 text-sm font-medium">อัตราผู้สอบผ่าน (Pass Rate)</div>
                <div className={`p-2 rounded-lg ${data.stats.passRate >= 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {data.stats.passRate >= 80 ? <CheckCircle2 className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
                </div>
              </div>
              <div className="text-3xl font-bold font-mono">{data.stats.passRate}%</div>
              <div className="text-xs text-gray-400 mt-2">ผ่าน {data.stats.passedCount} จากทั้งหมด {data.stats.totalTrained} คน</div>
            </div>

            <div className="bg-white border hover:border-indigo-300 border-[var(--color-border)] p-5 rounded-2xl shadow-sm transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="text-gray-500 text-sm font-medium">คะแนนเฉลี่ย (Average Score)</div>
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <TrendingUp className="w-5 h-5"/>
                </div>
              </div>
              <div className="text-3xl font-bold font-mono text-blue-700">{data.stats.avgScore}%</div>
              <div className="text-xs text-gray-400 mt-2">คะแนนจากการสอบครั้งล่าสุด</div>
            </div>

            <div className="bg-white border hover:border-indigo-300 border-[var(--color-border)] p-5 rounded-2xl shadow-sm transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="text-gray-500 text-sm font-medium">พัฒนาการการเรียนรู้</div>
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <BookOpen className="w-5 h-5"/>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold font-mono">{data.stats.avgPretest}<span className="text-sm text-gray-400 mx-1">&rarr;</span>{data.stats.avgPosttest}</div>
              </div>
              <div className="text-xs text-purple-600 font-medium mt-2">
                +{data.stats.avgPosttest - data.stats.avgPretest}% เฉลี่ยคะแนนที่เพิ่มขึ้น
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border hover:border-gray-600 border-gray-700 p-5 rounded-2xl shadow-sm transition-all text-white">
              <div className="flex justify-between items-start mb-2">
                <div className="text-gray-400 text-sm font-medium">สถิติจำนวนคน</div>
                <div className="p-2 rounded-lg bg-gray-700 text-gray-300">
                  <Users className="w-5 h-5"/>
                </div>
              </div>
              <div className="space-y-1 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">เข้าอบรมแล้ว:</span>
                  <span className="font-bold">{data.stats.totalTrained} คน</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">ยังเรียนประเมินผล:</span>
                  <span className="font-bold text-amber-400">{data.stats.inProgressCount} คน</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">สอบตก:</span>
                  <span className="font-bold text-red-400">{data.stats.failedCount} คน</span>
                </div>
              </div>
            </div>
          </div>

          {/* Missing / Overdue Table for Mandatory Courses */}
          {data.course.isMandatory ? (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
               <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-red-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-red-800">รายชื่อพนักงานที่ยังไม่ได้อบรม (Missing / Overdue)</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-red-600 bg-white px-3 py-1 rounded-full shadow-sm border border-red-200">
                    ยอดรวม {data.missingEmployees.length} คน
                  </div>
                  {data.missingEmployees.length > 0 && (
                     <button onClick={handleExportMissing} className="btn-secondary text-xs h-8 flex items-center gap-1 border-red-200 text-red-700 hover:bg-red-100">
                       <Download className="w-3.5 h-3.5" />
                       Export Excel
                     </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-gray-500 sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="px-4 py-3 border-b">พนักงาน</th>
                      <th className="px-4 py-3 border-b">สาขา / ตำแหน่ง</th>
                      <th className="px-4 py-3 border-b">วันเริ่มงาน</th>
                      <th className="px-4 py-3 border-b">สถานะติดตาม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.missingEmployees.length > 0 ? (
                      data.missingEmployees.map((emp: any) => (
                        <tr key={emp.id} className={`hover:bg-gray-50 transition-colors ${emp.isOverdue ? 'bg-red-50/30' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="font-bold text-[var(--color-text)]">{emp.fullName}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{emp.employeeCode}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{emp.branchCode}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{emp.positionCode}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                             {emp.startDate ? new Date(emp.startDate).toLocaleDateString('th-TH') : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {!data.course.hasDeadline ? (
                              <div className="flex items-center gap-1.5 text-gray-600 font-bold bg-gray-100 w-fit px-2.5 py-1 rounded-md text-xs border border-gray-200">
                                <Clock className="w-3.5 h-3.5"/>
                                ยังไม่ได้อบรม
                              </div>
                            ) : emp.isOverdue ? (
                              <div className="flex items-center gap-1.5 text-red-600 font-bold bg-red-100 w-fit px-2.5 py-1 rounded-md text-xs border border-red-200">
                                <AlertTriangle className="w-3.5 h-3.5"/>
                                ล่าช้า (อายุงาน {emp.daysSinceStart} วัน)
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-100 w-fit px-2.5 py-1 rounded-md text-xs border border-amber-200">
                                <Clock className="w-3.5 h-3.5"/>
                                ยังไม่ครบกำหนด (อายุงาน {emp.daysSinceStart} วัน)
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-16 text-center text-emerald-600 font-medium flex flex-col items-center justify-center">
                          <CheckCircle2 className="w-12 h-12 mb-2 text-emerald-400" />
                          พนักงานทุกคนเข้ารับการอบรมหลักสูตรนี้เรียบร้อยแล้ว ยอดเยี่ยมมาก!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
             <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
               <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
               <p className="font-medium text-lg text-gray-600">หลักสูตรนี้เป็นหลักสูตรทางเลือก (ไม่บังคับ)</p>
               <p className="text-sm mt-1">ระบบจะไม่ติดตามรายชื่อพนักงานที่ยังไม่ได้เรียนสำหรับหลักสูตรนี้</p>
             </div>
          )}
        </>
      )}
    </div>
  )
}

