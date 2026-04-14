'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  departmentCode: string
}

interface Course {
  id: string
  code: string
  title: string
  trainingType: string
}

export default function AssignmentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [assignments, setAssignments] = useState<Array<{
    id: string
    employee: Employee
    course: Course
    status: string
    dueDate: string | null
    assignedAt: string
  }>>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/assignments')
      if (res.ok) setAssignments(await res.json())
    } catch {
      // ignore
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'badge-success'
      case 'IN_PROGRESS': return 'badge-warning'
      default: return 'badge-gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'เสร็จแล้ว'
      case 'IN_PROGRESS': return 'กำลังเรียน'
      default: return 'ยังไม่เริ่ม'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">มอบหมายหลักสูตร</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Assign คอร์สให้พนักงาน</p>
        </div>
        <Link href="/admin/assignments/create" className="btn-primary">
          <Plus className="w-5 h-5" />
          มอบหมายหลักสูตร
        </Link>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes('สำเร็จ') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>พนักงาน</th>
              <th>คอร์ส</th>
              <th>สถานะ</th>
              <th>กำหนดเสร็จ</th>
              <th>วันที่มอบหมาย</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-[var(--color-text-secondary)]">ยังไม่มีการมอบหมายหลักสูตร</p>
                </td>
              </tr>
            ) : (
              assignments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="font-medium">{a.employee?.fullName}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{a.employee?.employeeCode}</div>
                  </td>
                  <td>
                    <div className="font-medium">{a.course?.title}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{a.course?.code}</div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(a.status)}`}>{getStatusLabel(a.status)}</span>
                  </td>
                  <td>{a.dueDate ? new Date(a.dueDate).toLocaleDateString('th-TH') : '-'}</td>
                  <td>{new Date(a.assignedAt).toLocaleDateString('th-TH')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
