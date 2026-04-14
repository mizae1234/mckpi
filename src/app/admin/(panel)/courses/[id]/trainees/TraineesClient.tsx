'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, MapPin, User, Users, Clock, CheckCircle2, XCircle, AlertTriangle, Search, BookOpen, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  branchCode: string | null
  departmentCode: string | null
}

interface Registration {
  id: string
  status: string
  registeredAt: string
  employee: Employee
}

interface OnlineLearner {
  id: string
  status: string
  source: string
  score: number | null
  createdAt: string
  completedAt: string | null
  employee: Employee
}

interface SessionData {
  id: string
  sessionDate: string
  sessionEndDate: string | null
  location: string
  capacity: number
  trainerName: string
  registrations: Registration[]
}

const regStatusColors: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-700',
  WAITLISTED: 'bg-amber-100 text-amber-700',
  ATTENDED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-200 text-gray-700',
}

const regStatusLabels: Record<string, string> = {
  REGISTERED: 'ลงทะเบียน',
  WAITLISTED: 'สำรอง',
  ATTENDED: 'เข้าร่วมแล้ว',
  CANCELLED: 'ยกเลิก',
  NO_SHOW: 'ไม่มา',
}

const resultStatusColors: Record<string, string> = {
  PASSED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
}

const resultStatusLabels: Record<string, string> = {
  PASSED: 'ผ่าน',
  IN_PROGRESS: 'กำลังเรียน',
  FAILED: 'ไม่ผ่าน',
}

// ─── ADD TRAINEE MODAL ──────────────────────────────
function AddTraineeModal({ 
  courseId, trainingType, sessionId, onClose, onAdded 
}: { 
  courseId: string
  trainingType: string
  sessionId?: string 
  onClose: () => void
  onAdded: () => void
}) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/employees')
      .then(r => r.json())
      .then(data => { setEmployees(data); setLoading(false) })
      .catch(() => setLoading(false))
    setTimeout(() => searchRef.current?.focus(), 100)
  }, [])

  const filtered = employees.filter(e =>
    !searchTerm.trim() ||
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 20) // Limit to top 20 results

  const handleAdd = async (empId: string) => {
    setAdding(empId)
    setError('')
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/trainees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, sessionId })
      })
      const data = await res.json()
      if (res.ok) {
        onAdded()
        onClose()
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setAdding(null)
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">เพิ่มผู้เข้าอบรม</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">ค้นหาและเลือกพนักงาน</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="พิมพ์ชื่อหรือรหัสพนักงาน..."
              className="input-field pl-9 w-full bg-white"
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
        </div>

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {searchTerm ? 'ไม่พบพนักงาน' : 'ไม่มีข้อมูลพนักงาน'}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => handleAdd(emp.id)}
                  disabled={adding === emp.id}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    adding === emp.id ? 'bg-gray-100 opacity-60' : 'hover:bg-indigo-50 hover:shadow-sm'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {emp.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[var(--color-text)] truncate">{emp.fullName}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {emp.employeeCode} {emp.departmentCode ? `• ${emp.departmentCode}` : ''}
                    </div>
                  </div>
                  {adding === emp.id ? (
                    <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── MAIN COMPONENT ──────────────────────────────
export default function TraineesClient({ 
  courseId, 
  trainingType,
  sessions: initialSessions, 
  onlineLearners: initialOnlineLearners 
}: { 
  courseId: string
  trainingType: string
  sessions: SessionData[]
  onlineLearners: OnlineLearner[]
}) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [onlineLearners, setOnlineLearners] = useState(initialOnlineLearners)
  const [activeSessionId, setActiveSessionId] = useState<string>(initialSessions[0]?.id || '')
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)

  const isOnline = trainingType === 'ONLINE' || trainingType === 'EXTERNAL'

  const activeSession = sessions.find(s => s.id === activeSessionId)
  const regs = activeSession?.registrations || []

  // Filtered registrations (classroom)
  const filteredRegs = regs.filter(r => {
    const matchSearch = !search.trim() ||
      r.employee.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.employee.employeeCode.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  // Filtered online learners
  const filteredOnline = onlineLearners.filter(r => {
    const matchSearch = !search.trim() ||
      r.employee.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.employee.employeeCode.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  // Stats
  const onlinePassed = onlineLearners.filter(r => r.status === 'PASSED').length
  const onlineInProgress = onlineLearners.filter(r => r.status === 'IN_PROGRESS').length
  const onlineFailed = onlineLearners.filter(r => r.status === 'FAILED').length

  const classroomActiveCount = regs.filter(r => r.status !== 'CANCELLED').length
  const classroomAttendedCount = regs.filter(r => r.status === 'ATTENDED').length
  const classroomCancelledCount = regs.filter(r => r.status === 'CANCELLED').length

  const totalAllSessions = sessions.reduce((sum, s) => sum + s.registrations.filter(r => r.status !== 'CANCELLED').length, 0)

  const handleStatusChange = async (sessionId: string, registrationId: string, newStatus: string) => {
    setUpdating(registrationId)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sessions/${sessionId}/registrations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, status: newStatus }),
      })

      if (res.ok) {
        const updated = await res.json()
        setSessions(sessions.map(s => ({
          ...s,
          registrations: s.registrations.map(r => r.id === registrationId ? { ...r, status: updated.status } : r)
        })))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  const handleAdded = () => {
    // Refresh page data from server
    router.refresh()
    // Re-fetch to update local state  
    setTimeout(() => window.location.reload(), 300)
  }

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  const formatFullDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // ─── ADD BUTTON ──────────────────────────────
  const addButton = (
    <button
      onClick={() => setShowAddModal(true)}
      className="btn-primary text-sm gap-1.5"
    >
      <Plus className="w-4 h-4" /> เพิ่มผู้เข้าอบรม
    </button>
  )

  // ─── ONLINE / EXTERNAL COURSES ──────────────────────────
  if (isOnline) {
    return (
      <div className="space-y-5">
        {showAddModal && (
          <AddTraineeModal courseId={courseId} trainingType={trainingType} onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-text)]">{onlineLearners.length}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">ผู้เรียนทั้งหมด</div>
          </div>
          <div className="stat-card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{onlinePassed}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">ผ่าน</div>
          </div>
          <div className="stat-card p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{onlineInProgress}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">กำลังเรียน</div>
          </div>
          <div className="stat-card p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{onlineFailed}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">ไม่ผ่าน</div>
          </div>
        </div>

        {/* Search + Filter + Add Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหรือรหัสพนักงาน..." className="input-field pl-9 w-full bg-white shadow-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field w-full sm:w-44 bg-white shadow-sm">
            <option value="ALL">ทุกสถานะ</option>
            {Object.entries(resultStatusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {addButton}
        </div>

        {/* Online Learners Table */}
        <div className="stat-card p-0 overflow-hidden">
          {onlineLearners.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">ยังไม่มีผู้เรียนในหลักสูตรนี้</p>
              <button onClick={() => setShowAddModal(true)} className="mt-4 text-indigo-600 text-sm font-semibold hover:underline">+ เพิ่มผู้เข้าอบรม</button>
            </div>
          ) : filteredOnline.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">ไม่พบข้อมูลที่ค้นหา</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[var(--color-border)]">
                    <th className="px-5 py-3 text-left font-semibold text-gray-600 w-12">#</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">รหัส</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">ชื่อ-นามสกุล</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">สาขา / แผนก</th>
                    <th className="px-5 py-3 text-center font-semibold text-gray-600">คะแนน</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">วันที่เริ่มเรียน</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">วันที่สำเร็จ</th>
                    <th className="px-5 py-3 text-center font-semibold text-gray-600">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredOnline.map((learner, idx) => (
                    <tr key={learner.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-gray-400 text-xs font-mono">{idx + 1}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">{learner.employee.employeeCode}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-[var(--color-text)]">{learner.employee.fullName}</div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {[learner.employee.branchCode, learner.employee.departmentCode].filter(Boolean).join(' • ') || '-'}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-gray-700">
                        {learner.score !== null ? `${learner.score}%` : '-'}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{formatFullDate(learner.createdAt)}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{formatFullDate(learner.completedAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-center">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${resultStatusColors[learner.status] || 'bg-gray-100'}`}>
                            {resultStatusLabels[learner.status] || learner.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── CLASSROOM (OFFLINE) COURSES ─────────────────────────
  if (sessions.length === 0) {
    return (
      <div className="stat-card p-12 text-center">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-[var(--color-text-secondary)]">ยังไม่มีรอบอบรมสำหรับหลักสูตรนี้</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {showAddModal && activeSession && (
        <AddTraineeModal courseId={courseId} trainingType={trainingType} sessionId={activeSession.id} onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
      )}

      {/* Session Tabs */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--color-text)]">เลือกรอบอบรม</h3>
            <span className="text-xs text-[var(--color-text-secondary)]">ทั้งหมด {sessions.length} รอบ • {totalAllSessions} คนลงทะเบียน</span>
          </div>
        </div>
        <div className="flex overflow-x-auto p-2 gap-2">
          {sessions.map((session, idx) => {
            const isActive = session.id === activeSessionId
            const regCount = session.registrations.filter(r => r.status !== 'CANCELLED').length
            const attendCount = session.registrations.filter(r => r.status === 'ATTENDED').length

            return (
              <button
                key={session.id}
                onClick={() => { setActiveSessionId(session.id); setSearch(''); setFilterStatus('ALL') }}
                className={`flex-shrink-0 flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all min-w-[180px] ${
                  isActive 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                    : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate ${isActive ? 'text-indigo-700' : 'text-[var(--color-text)]'}`}>
                      {formatShortDate(session.sessionDate)}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-secondary)]">
                      {formatTime(session.sessionDate)} น.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full mt-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${regCount >= session.capacity ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    {regCount}/{session.capacity} คน
                  </span>
                  {attendCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-600">
                      ✓ {attendCount}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {activeSession && (
        <>
          {/* Session Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card p-4 text-center">
              <div className="text-xl font-bold text-blue-600">{classroomActiveCount}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)] font-medium">ลงทะเบียน</div>
            </div>
            <div className="stat-card p-4 text-center">
              <div className="text-xl font-bold text-green-600">{classroomAttendedCount}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)] font-medium">เข้าร่วมแล้ว</div>
            </div>
            <div className="stat-card p-4 text-center">
              <div className="text-xl font-bold text-red-500">{classroomCancelledCount}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)] font-medium">ยกเลิก</div>
            </div>
          </div>

          {/* Search + Filter + Add Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อหรือรหัสพนักงาน..." className="input-field pl-9 w-full bg-white shadow-sm" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-full sm:w-44 bg-white shadow-sm">
              <option value="ALL">ทุกสถานะ</option>
              {Object.entries(regStatusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            {addButton}
          </div>

          {/* Registrations Table */}
          <div className="stat-card p-0 overflow-hidden">
            {regs.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">ยังไม่มีผู้ลงทะเบียนในรอบนี้</p>
                <button onClick={() => setShowAddModal(true)} className="mt-4 text-indigo-600 text-sm font-semibold hover:underline">+ เพิ่มผู้เข้าอบรม</button>
              </div>
            ) : filteredRegs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">ไม่พบข้อมูลที่ค้นหา</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[var(--color-border)]">
                      <th className="px-5 py-3 text-left font-semibold text-gray-600 w-12">#</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">รหัส</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">ชื่อ-นามสกุล</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">สาขา / แผนก</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">วันที่ลงทะเบียน</th>
                      <th className="px-5 py-3 text-center font-semibold text-gray-600">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {filteredRegs.map((reg, idx) => (
                      <tr key={reg.id} className={`hover:bg-gray-50/50 transition-colors ${reg.status === 'CANCELLED' ? 'opacity-40' : ''}`}>
                        <td className="px-5 py-3 text-gray-400 text-xs font-mono">{idx + 1}</td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-600">{reg.employee.employeeCode}</td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-[var(--color-text)]">{reg.employee.fullName}</div>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {[reg.employee.branchCode, reg.employee.departmentCode].filter(Boolean).join(' • ') || '-'}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{formatFullDate(reg.registeredAt)}</td>
                        <td className="px-5 py-3">
                          <div className="flex justify-center">
                            <select
                              value={reg.status}
                              onChange={(e) => handleStatusChange(activeSession.id, reg.id, e.target.value)}
                              disabled={updating === reg.id}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer ${regStatusColors[reg.status] || 'bg-gray-100'} ${updating === reg.id ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              {Object.entries(regStatusLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
