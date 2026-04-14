'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, GraduationCap, Clock, CheckCircle2, Search } from 'lucide-react'

export default function CourseListClient({ courses }: { courses: any[] }) {
  const [search, setSearch] = useState('')

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses
    const q = search.toLowerCase()
    return courses.filter(c => 
      c.code.toLowerCase().includes(q) || 
      c.title.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    )
  }, [courses, search])

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'ONLINE': return { label: 'Online', color: 'badge-info' }
      case 'OFFLINE': return { label: 'Classroom (ตามรอบ / ไลฟ์)', color: 'badge-accent' }
      case 'EXTERNAL': return { label: 'External', color: 'badge-primary' }
      default: return { label: type, color: 'badge-gray' }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">รายการหลักสูตรทั้งหมด</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">เลือกหลักสูตรที่คุณสนใจเพื่อเข้าอบรมได้เลย</p>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส, ป้ายกำกับ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-full bg-white shadow-sm"
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="stat-card p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)]">ไม่พบหลักสูตรที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course: any) => {
            const typeInfo = getTypeInfo(course.trainingType)
            
            let href = `/learning/courses/${course.id}`
            if (course.trainingType === 'EXTERNAL') href = `/learning` // Placeholder

            return (
              <Link 
                key={course.id} 
                href={href}
                className="group stat-card p-0 flex flex-col hover:shadow-lg transition-all border border-[var(--color-border)] hover:border-primary/50 overflow-hidden"
              >
                {/* Card Header Image / Color */}
                <div className="h-24 gradient-bg relative flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-white/30" />
                  <div className="absolute top-3 right-3 flex gap-1">
                    <span className={`badge bg-white shadow-sm text-xs font-bold ${
                      course.trainingType === 'ONLINE' ? 'text-blue-600' : 'text-purple-600'
                    }`}>
                      {typeInfo.label}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-md">
                      {course.code}
                    </span>
                    {course.isMandatory && (
                      <span className="badge badge-danger text-[10px]">บังคับเรียน</span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg text-[var(--color-text)] mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 flex-1">
                    {course.description || 'ไม่มีคำอธิบายสำหรับหลักสูตรนี้'}
                  </p>

                  <div className="border-t border-[var(--color-border)] pt-4 mt-auto flex items-center justify-between">
                    <div className="text-xs text-[var(--color-text-secondary)] font-medium">
                      {course.trainingType === 'ONLINE' ? `${course.stepCount} ขั้นตอนเรียน` : ''}
                      {course.trainingType === 'OFFLINE' ? `${course.sessionCount} รอบอบรม` : ''}
                    </div>

                    {course.assignmentStatus ? (
                      course.assignmentStatus === 'COMPLETED' ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านแล้ว
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" /> กำลังเรียน
                        </div>
                      )
                    ) : (
                      <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                        เริ่มเรียนเนื้อหา →
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
