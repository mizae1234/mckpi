'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Search, CheckSquare, Square } from 'lucide-react'

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  departmentCode: string
  branchCode: string
  positionCode: string
}

interface Course {
  id: string
  code: string
  title: string
  trainingType: string
}

export default function CreateBulkAssignmentPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiReasoning, setAiReasoning] = useState('')

  // Selected State
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [dueDate, setDueDate] = useState('')

  // Search State
  const [empSearch, setEmpSearch] = useState('')
  const [courseSearch, setCourseSearch] = useState('')

  useEffect(() => {
    // Only fetch courses initially. Employees will be fetched on search.
    fetch('/api/admin/courses')
      .then(async (courseRes) => {
        if (courseRes.ok) setCourses(await courseRes.json())
      })
      .catch(() => setError('ไม่สามารถดึงข้อมูลหลักสูตรได้'))
  }, [])

  const handleSearchEmployee = async () => {
    if (!empSearch.trim()) {
      setEmployees([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/employees?q=${encodeURIComponent(empSearch)}`)
      if (res.ok) {
        setEmployees(await res.json())
      }
    } catch {
      setError('เชื่อมต่อระบบค้นหาหลักล้มเหลว')
    } finally {
      setLoading(false)
    }
  }

  const handleAiRecommend = async () => {
    if (selectedCourses.size === 0) {
      setError('กรุณาเลือกหลักสูตรอย่างน้อย 1 รายการก่อนให้ AI วิเคราะห์')
      return
    }
    setAiLoading(true)
    setError('')
    setAiReasoning('')
    try {
      // 1. Get Course Recommendation
      const res = await fetch('/api/admin/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: Array.from(selectedCourses) })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI Failed')
      
      if (data.suggestedDepartments && data.suggestedDepartments.length > 0) {
        setAiReasoning(data.reasoning)
        // 2. Fetch those employees
        const empRes = await fetch(`/api/admin/employees?departments=${encodeURIComponent(data.suggestedDepartments.join(','))}`)
        if (empRes.ok) {
           const recommendedEmp = await empRes.json()
           setEmployees(recommendedEmp)
           
           // Automatically Tick them!
           const newSet = new Set(selectedEmployees)
           recommendedEmp.forEach((e: Employee) => newSet.add(e.id))
           setSelectedEmployees(newSet)
        }
      } else {
        setAiReasoning('AI ประเมินว่าคอร์สนี้มีความยืดหยุ่นสูง หรือไม่สามารถระบุกลุ่มเป้าหมายเฉพาะเจาะจงได้ในตอนนี้')
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลด AI')
    } finally {
      setAiLoading(false)
    }
  }

  const handleEmpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchEmployee()
  }

  // Employees are already filtered by the server
  const filteredEmployees = employees

  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses
    const q = courseSearch.toLowerCase()
    return courses.filter(c => 
      (c.code || '').toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q)
    )
  }, [courses, courseSearch])

  // Select All Toggles
  const handleSelectAllEmployees = () => {
    if (selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0) {
      // Deselect all current filtered
      const newSet = new Set(selectedEmployees)
      filteredEmployees.forEach(e => newSet.delete(e.id))
      setSelectedEmployees(newSet)
    } else {
      // Select all current filtered
      const newSet = new Set(selectedEmployees)
      filteredEmployees.forEach(e => newSet.add(e.id))
      setSelectedEmployees(newSet)
    }
  }

  const handleSelectAllCourses = () => {
    if (selectedCourses.size === filteredCourses.length && filteredCourses.length > 0) {
      const newSet = new Set(selectedCourses)
      filteredCourses.forEach(e => newSet.delete(e.id))
      setSelectedCourses(newSet)
    } else {
      const newSet = new Set(selectedCourses)
      filteredCourses.forEach(e => newSet.add(e.id))
      setSelectedCourses(newSet)
    }
  }

  const toggleEmployee = (id: string) => {
    const newSet = new Set(selectedEmployees)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedEmployees(newSet)
  }

  const toggleCourse = (id: string) => {
    const newSet = new Set(selectedCourses)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedCourses(newSet)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedEmployees.size === 0 || selectedCourses.size === 0) {
      setError('กรุณาเลือกพนักงานและคอร์สอย่างน้อย 1 รายการ')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: Array.from(selectedEmployees),
          courseIds: Array.from(selectedCourses),
          dueDate: dueDate || null
        }),
      })

      if (!res.ok) {
        const result = await res.json()
        setError(result.error || 'เกิดข้อผิดพลาด')
        setLoading(false)
        return
      }

      router.push('/admin/assignments')
      router.refresh()
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/assignments" className="btn-secondary py-2 px-3">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">มอบหมายหลักสูตร (Bulk Assign)</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">เลือกพนักงานและคอร์สจำนวนมากในครั้งเดียว</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Course Selection */}
          <div className="stat-card p-6 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">1. เลือกหลักสูตร</h2>
              <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                เลือกแล้ว {selectedCourses.size}
              </span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาคอร์ส (รหัส, ชื่อ)..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="input-field pl-9"
              />
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
              <button
                type="button"
                onClick={handleSelectAllCourses}
                className="flex items-center gap-2 text-sm text-[var(--color-primary)] font-medium hover:opacity-80 transition-opacity"
              >
                {selectedCourses.size === filteredCourses.length && filteredCourses.length > 0 ? (
                  <><CheckSquare className="w-4 h-4" /> ยกเลิกการเลือกทั้งหมด</>
                ) : (
                  <><Square className="w-4 h-4" /> เลือกทั้งหมด</>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">ไม่พบหลักสูตร</div>
              ) : (
                filteredCourses.map(course => (
                  <label key={course.id} className="flex items-center p-3 hover:bg-gray-50 rounded-xl cursor-pointer border border-transparent hover:border-gray-100 transition-colors gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCourses.has(course.id)}
                      onChange={() => toggleCourse(course.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[var(--color-text)] truncate">{course.code}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">{course.title}</div>
                    </div>
                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded whitespace-nowrap">{course.trainingType}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Employee Selection */}
          <div className="stat-card p-6 flex flex-col h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  พนักงาน {selectedEmployees.size > 0 && <span className="text-sm font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-2">เลือกแล้ว {selectedEmployees.size} คน</span>}
                </h2>
                
                {selectedCourses.size > 0 && (
                  <button 
                    type="button" 
                    onClick={handleAiRecommend} 
                    disabled={aiLoading}
                    className="btn-accent px-3 py-1.5 text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 flex items-center gap-1.5"
                  >
                    {aiLoading ? (
                      <span className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span className="text-base leading-none">✨</span>
                    )}
                    {aiLoading ? 'AI กำลังวิเคราะห์...' : 'ให้ AI แนะนำ'}
                  </button>
                )}
              </div>

              {aiReasoning && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-800">
                  <span className="font-semibold block mb-1">✨ AI วิเคราะห์:</span>
                  {aiReasoning}
                </div>
              )}

              <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหาแล้วกด Enter หรือกดปุ่มค้นหา..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  onKeyDown={handleEmpKeyDown}
                  className="input-field pl-9"
                />
              </div>
              <button
                type="button"
                onClick={handleSearchEmployee}
                className="btn-primary text-sm whitespace-nowrap px-4"
              >
                ค้นหา
              </button>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
              <button
                type="button"
                onClick={handleSelectAllEmployees}
                className="flex items-center gap-2 text-sm text-[var(--color-primary)] font-medium hover:opacity-80 transition-opacity"
              >
                {selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0 ? (
                  <><CheckSquare className="w-4 h-4" /> ยกเลิกการเลือกทั้งหมด ({filteredEmployees.length})</>
                ) : (
                  <><Square className="w-4 h-4" /> เลือกทั้งหมด ({filteredEmployees.length})</>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {loading ? (
                <div className="text-center py-10 text-gray-400 text-sm">กำลังค้นหาข้อมูลพนักงาน...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  {empSearch ? 'ไม่พบรายชื่อพนักงานที่ตรงกับคำจำกัดความ' : 'พิมพ์คำค้นหาเพื่อโหลดรายชื่อพนักงาน'}
                </div>
              ) : (
                filteredEmployees.map(emp => (
                  <label key={emp.id} className="flex items-center p-3 hover:bg-gray-50 rounded-xl cursor-pointer border border-transparent hover:border-gray-100 transition-colors gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.has(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[var(--color-text)] truncate">{emp.employeeCode} - {emp.fullName}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {emp.positionCode || '-'} {emp.departmentCode ? `| ฝ่าย: ${emp.departmentCode}` : ''} {emp.branchCode ? `| สาขา: ${emp.branchCode}` : ''}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="stat-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">กำหนดเสร็จ (ถ้ามี)</label>
            <input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
              className="input-field max-w-[200px]" 
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {error && <span className="text-red-500 text-sm">{error}</span>}
            <Link href="/admin/assignments" className="btn-secondary px-6">
              ยกเลิก
            </Link>
            <button 
              type="submit" 
              disabled={loading || selectedEmployees.size === 0 || selectedCourses.size === 0}
              className="btn-primary px-8 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save className="w-5 h-5" /> ยืนยันการมอบหมาย</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
