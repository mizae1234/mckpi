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
  const [error, setError] = useState('')

  // Selected State
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [dueDate, setDueDate] = useState('')

  // Search State
  const [empSearch, setEmpSearch] = useState('')
  const [courseSearch, setCourseSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/employees'),
      fetch('/api/admin/courses'),
    ])
      .then(async ([empRes, courseRes]) => {
        if (empRes.ok) setEmployees(await empRes.json())
        if (courseRes.ok) setCourses(await courseRes.json())
      })
      .catch(() => setError('ไม่สามารถดึงข้อมูลได้'))
  }, [])

  // Filtering
  const filteredEmployees = useMemo(() => {
    if (!empSearch.trim()) return employees
    const q = empSearch.toLowerCase()
    return employees.filter(e => 
      (e.employeeCode || '').toLowerCase().includes(q) ||
      (e.fullName || '').toLowerCase().includes(q) ||
      (e.positionCode || '').toLowerCase().includes(q) ||
      (e.branchCode || '').toLowerCase().includes(q) ||
      (e.departmentCode || '').toLowerCase().includes(q)
    )
  }, [employees, empSearch])

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
              <h2 className="text-lg font-bold">2. เลือกพนักงาน</h2>
              <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                เลือกแล้ว {selectedEmployees.size}
              </span>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหา (รหัส, ชื่อ, ตำแหน่ง, สาขา)..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="input-field pl-9"
              />
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
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">ไม่พบรายชื่อพนักงาน</div>
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
                        {emp.positionCode || '-'} {emp.branchCode ? `| สาขา: ${emp.branchCode}` : ''}
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
