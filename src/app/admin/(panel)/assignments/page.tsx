'use client'

import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Save, X } from 'lucide-react'

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
  const [showModal, setShowModal] = useState(false)
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
    const [empRes, courseRes, assignRes] = await Promise.all([
      fetch('/api/admin/employees'),
      fetch('/api/admin/courses'),
      fetch('/api/admin/assignments'),
    ])
    if (empRes.ok) setEmployees(await empRes.json())
    if (courseRes.ok) setCourses(await courseRes.json())
    if (assignRes.ok) setAssignments(await assignRes.json())
  }

  const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const data = {
      employeeId: formData.get('employeeId'),
      courseId: formData.get('courseId'),
      dueDate: formData.get('dueDate') || null,
    }

    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setMessage('มอบหมายงานสำเร็จ!')
        setShowModal(false)
        fetchData()
      } else {
        const result = await res.json()
        setMessage(result.error || 'เกิดข้อผิดพลาด')
      }
    } catch {
      setMessage('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl font-bold text-[var(--color-text)]">มอบหมายงาน</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Assign คอร์สให้พนักงาน</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          มอบหมายงาน
        </button>
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
                  <p className="text-[var(--color-text-secondary)]">ยังไม่มีการมอบหมายงาน</p>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--color-text)]">มอบหมายงานใหม่</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">พนักงาน *</label>
                <select name="employeeId" className="input-field" required>
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.employeeCode} — {e.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">คอร์ส *</label>
                <select name="courseId" className="input-field" required>
                  <option value="">-- เลือกคอร์ส --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>[{c.trainingType}] {c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">กำหนดเสร็จ</label>
                <input name="dueDate" type="date" className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">ยกเลิก</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      มอบหมาย
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
