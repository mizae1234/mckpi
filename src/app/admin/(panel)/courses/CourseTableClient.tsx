'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Search, ChevronDown, ChevronRight, Edit, Settings, MoreVertical, Users } from 'lucide-react'
import DeleteCourseButton from './DeleteCourseButton'

export default function CourseTableClient({ courses }: { courses: any[] }) {
  const [search, setSearch] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLTableSectionElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newSet = new Set(expandedRows)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedRows(newSet)
  }

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses
    const q = search.toLowerCase()
    return courses.filter(c => 
      c.code.toLowerCase().includes(q) || 
      c.title.toLowerCase().includes(q)
    )
  }, [courses, search])

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ONLINE': return 'badge-info'
      case 'OFFLINE': return 'badge-accent'
      case 'EXTERNAL': return 'badge-primary'
      default: return 'badge-gray'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'badge-success'
      case 'DRAFT': return 'badge-warning'
      case 'ARCHIVED': return 'badge-gray'
      default: return 'badge-gray'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">การจัดการหลักสูตร</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">สร้างและจัดการหลักสูตรอบรม</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหารหัส หรือ ชื่อหลักสูตร..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 w-full bg-white shadow-sm"
            />
          </div>
          <Link href="/admin/courses/create" className="btn-primary whitespace-nowrap">
            <Plus className="w-5 h-5" />
            สร้างคอร์ส
          </Link>
        </div>
      </div>

      <div className="table-container shadow-sm border border-[var(--color-border)] min-h-[300px]">
        <table>
          <thead>
            <tr>
              <th className="w-10"></th>
              <th>รหัสหลักสูตร</th>
              <th>ชื่อหลักสูตร</th>
              <th>ประเภท</th>
              <th>สถานะ / การบังคับ</th>
              <th>ผู้เข้าเรียน</th>
              <th className="text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-[var(--color-text-secondary)]">
                  ไม่พบหลักสูตรที่ค้นหา
                </td>
              </tr>
            ) : (
              filteredCourses.map(course => {
                const isExpanded = expandedRows.has(course.id)
                const hasSessions = course.trainingType === 'OFFLINE' && course.sessions?.length > 0

                return (
                  <React.Fragment key={course.id}>
                    <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                      <td className="text-center cursor-pointer" onClick={(e) => hasSessions && toggleRow(course.id, e)}>
                        {hasSessions ? (
                          <div className="p-1 rounded hover:bg-gray-200 inline-flex transition-colors">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </div>
                        ) : (
                          <div className="w-4 h-4"></div>
                        )}
                      </td>
                      <td className="font-mono text-sm text-gray-600">{course.code}</td>
                      <td>
                        <Link href={`/admin/courses/${course.id}`} className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                          {course.title}
                        </Link>
                      </td>
                      <td>
                        <span className={`badge ${getTypeBadge(course.trainingType)} text-[10px]`}>
                          {course.trainingType === 'OFFLINE' ? 'CLASSROOM' : course.trainingType}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col items-start gap-1">
                          <span className={`badge ${getStatusBadge(course.status)} text-[10px]`}>
                            {course.status}
                          </span>
                          {course.isMandatory && (
                            <span className="badge badge-danger text-[10px]">บังคับ</span>
                          )}
                        </div>
                      </td>
                      <td className="text-sm font-medium">
                        {course.assignmentCount} <span className="text-xs text-gray-500 font-normal">คน</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2 relative">
                          <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setOpenMenuId(openMenuId === course.id ? null : course.id)
                            }}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openMenuId === course.id && (
                            <div className="absolute right-8 top-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                              <div className="py-1">
                                <Link 
                                  href={`/admin/courses/${course.id}`} 
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                                >
                                  <Settings className="w-4 h-4" />
                                  ตั้งค่าหลักสูตร
                                </Link>
                                <Link 
                                  href={`/admin/courses/${course.id}/trainees`} 
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                                >
                                  <Users className="w-4 h-4" />
                                  จัดการผู้เข้าอบรม
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expandable Offline Sessions details */}
                    {isExpanded && hasSessions && (
                      <tr className="bg-gray-50/80">
                        <td colSpan={7} className="p-0 border-b border-[var(--color-border)] relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40"></div>
                          <div className="py-4 px-12">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">รอบอบรม (Sessions)</h4>
                            <div className="grid grid-cols-1 overflow-x-auto">
                              <table className="w-full text-sm bg-white rounded-lg overflow-hidden border border-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-semibold text-gray-600 border-b">วันที่อบรม</th>
                                    <th className="px-4 py-2 text-left font-semibold text-gray-600 border-b">วิทยากร</th>
                                    <th className="px-4 py-2 text-left font-semibold text-gray-600 border-b">สถานที่</th>
                                    <th className="px-4 py-2 text-center font-semibold text-gray-600 border-b">ผู้ลงทะเบียน</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {course.sessions.map((session: any) => {
                                    const registered = session._count?.registrations || 0
                                    const percent = Math.min(100, Math.round((registered / session.capacity) * 100))
                                    return (
                                      <tr key={session.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                        <td className="px-4 py-2 whitespace-nowrap text-gray-800">
                                          {new Date(session.sessionDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{session.trainerName || '-'}</td>
                                        <td className="px-4 py-2 text-gray-600">{session.location || '-'}</td>
                                        <td className="px-4 py-2 text-center">
                                          <div className="inline-flex items-center gap-2">
                                            <span className="font-medium">{registered} / {session.capacity}</span>
                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden shrink-0">
                                              <div className={`h-full ${percent >= 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${percent}%` }}></div>
                                            </div>
                                          </div>
                                        </td>
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
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
