'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Pencil, Trash2, Users, Calendar, MapPin, User, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SessionData {
  id: string
  sessionDate: string
  sessionEndDate: string | null
  registrationEndDate: string | null
  location: string
  capacity: number
  waitlistCapacity: number
  trainerName: string
  meetingUrl: string | null
  registrationCount: number
}

export default function CourseSessionsManager({ courseId, initialSessions }: { courseId: string; initialSessions: SessionData[] }) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  // Form state
  const [formDate, setFormDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formRegEndDate, setFormRegEndDate] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formCapacity, setFormCapacity] = useState('30')
  const [formWaitlist, setFormWaitlist] = useState('0')
  const [formTrainer, setFormTrainer] = useState('')
  const [formMeetingUrl, setFormMeetingUrl] = useState('')

  const resetForm = () => {
    setFormDate('')
    setFormEndDate('')
    setFormRegEndDate('')
    setFormLocation('')
    setFormCapacity('30')
    setFormWaitlist('0')
    setFormTrainer('')
    setFormMeetingUrl('')
  }

  const startEdit = (s: SessionData) => {
    setEditingSession(s)
    setFormDate(s.sessionDate.slice(0, 16))
    setFormEndDate(s.sessionEndDate ? s.sessionEndDate.slice(0, 16) : '')
    setFormRegEndDate(s.registrationEndDate ? s.registrationEndDate.slice(0, 16) : '')
    setFormLocation(s.location)
    setFormCapacity(s.capacity.toString())
    setFormWaitlist(s.waitlistCapacity.toString())
    setFormTrainer(s.trainerName)
    setFormMeetingUrl(s.meetingUrl || '')
    setShowForm(false)
  }

  const cancelEdit = () => {
    setEditingSession(null)
    resetForm()
  }

  const handleCreate = async () => {
    if (!formDate) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate: formDate,
          sessionEndDate: formEndDate || null,
          registrationEndDate: formRegEndDate || null,
          location: formLocation,
          capacity: formCapacity,
          waitlistCapacity: formWaitlist,
          trainerName: formTrainer,
          meetingUrl: formMeetingUrl || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSessions([...sessions, {
          id: data.id,
          sessionDate: data.sessionDate,
          sessionEndDate: data.sessionEndDate,
          registrationEndDate: data.registrationEndDate,
          location: data.location,
          capacity: data.capacity,
          waitlistCapacity: data.waitlistCapacity,
          trainerName: data.trainerName,
          meetingUrl: data.meetingUrl,
          registrationCount: 0,
        }])
        setShowForm(false)
        resetForm()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingSession || !formDate) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sessions/${editingSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate: formDate,
          sessionEndDate: formEndDate || null,
          registrationEndDate: formRegEndDate || null,
          location: formLocation,
          capacity: formCapacity,
          waitlistCapacity: formWaitlist,
          trainerName: formTrainer,
          meetingUrl: formMeetingUrl || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSessions(sessions.map(s => s.id === editingSession.id ? {
          ...s,
          sessionDate: data.sessionDate,
          sessionEndDate: data.sessionEndDate,
          registrationEndDate: data.registrationEndDate,
          location: data.location,
          capacity: data.capacity,
          waitlistCapacity: data.waitlistCapacity,
          trainerName: data.trainerName,
          meetingUrl: data.meetingUrl,
        } : s))
        cancelEdit()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm('ลบรอบอบรมนี้?')) return
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sessions/${sessionId}`, { method: 'DELETE' })
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const renderForm = (isEdit: boolean) => (
    <div className="p-4 rounded-xl border-2 border-dashed border-[var(--color-border)] space-y-3 animate-fade-in bg-white">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-[var(--color-text)]">{isEdit ? 'แก้ไขรอบอบรม' : 'เพิ่มรอบอบรมใหม่'}</h4>
        <button onClick={isEdit ? cancelEdit : () => { setShowForm(false); resetForm() }} className="p-1 hover:bg-gray-100 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">📅 วันที่เริ่ม *</label>
          <input type="datetime-local" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="input-field py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">📅 วันที่สิ้นสุด</label>
          <input type="datetime-local" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} className="input-field py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">🔒 ปิดรับลงทะเบียน</label>
          <input type="datetime-local" value={formRegEndDate} onChange={(e) => setFormRegEndDate(e.target.value)} className="input-field py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">📍 สถานที่</label>
          <input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="input-field py-2 text-sm" placeholder="เช่น ห้องประชุม A" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">👥 จำนวนที่รับ (คน)</label>
          <input type="number" min="1" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} className="input-field py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">🔄 สำรอง (คน)</label>
          <input type="number" min="0" value={formWaitlist} onChange={(e) => setFormWaitlist(e.target.value)} className="input-field py-2 text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">🎤 วิทยากร (ไม่บังคับ)</label>
          <input value={formTrainer} onChange={(e) => setFormTrainer(e.target.value)} className="input-field py-2 text-sm" placeholder="ชื่อวิทยากร" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-[var(--color-text)] mb-1">🔗 ลิงก์ห้องออนไลน์ (Zoom/Teams - ไม่บังคับ)</label>
          <input type="url" value={formMeetingUrl} onChange={(e) => setFormMeetingUrl(e.target.value)} className="input-field py-2 text-sm" placeholder="https://..." />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={isEdit ? cancelEdit : () => { setShowForm(false); resetForm() }} className="btn-secondary text-sm px-4">ยกเลิก</button>
        <button onClick={isEdit ? handleUpdate : handleCreate} disabled={loading || !formDate} className="btn-primary text-sm px-4">
          {loading ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'เพิ่มรอบ'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      {sessions.length === 0 && !showForm ? (
        <p className="text-sm text-[var(--color-text-secondary)] py-4">ยังไม่มีรอบอบรม กดปุ่มด้านล่างเพื่อเพิ่ม</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const isEditing = editingSession?.id === session.id

            if (isEditing) {
              return <div key={session.id}>{renderForm(true)}</div>
            }

            const isExpanded = expandedSession === session.id

            return (
              <div key={session.id} className="rounded-xl border border-[var(--color-border)] overflow-hidden hover:shadow-sm transition-shadow">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50/50 transition-colors group"
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-[var(--color-text)]">
                      {formatDate(session.sessionDate)}
                      {session.sessionEndDate && ` — ${formatDate(session.sessionEndDate)}`}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {session.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>}
                      {session.trainerName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{session.trainerName}</span>}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {session.registrationCount}/{session.capacity} คน
                        {session.waitlistCapacity > 0 && ` (+${session.waitlistCapacity} สำรอง)`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(session) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="แก้ไข"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(session.id) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[var(--color-border)] bg-gray-50/30">
                    <SessionRegistrations courseId={courseId} sessionId={session.id} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm ? (
        renderForm(false)
      ) : !editingSession && (
        <button onClick={() => { setShowForm(true); resetForm() }} className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> เพิ่มรอบอบรม
        </button>
      )}
    </div>
  )
}

// ─── Inline Registrations List ────────────────────────────

function SessionRegistrations({ courseId, sessionId }: { courseId: string; sessionId: string }) {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const loadRegistrations = async () => {
      try {
        const res = await fetch(`/api/admin/courses/${courseId}/sessions/${sessionId}/registrations`)
        if (res.ok) {
          const data = await res.json()
          setRegistrations(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadRegistrations()
  }, [courseId, sessionId])

  const handleStatusChange = async (registrationId: string, newStatus: string) => {
    setUpdating(registrationId)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sessions/${sessionId}/registrations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, status: newStatus }),
      })

      if (res.ok) {
        const updated = await res.json()
        setRegistrations(registrations.map(r => r.id === registrationId ? updated : r))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  const statusColors: Record<string, string> = {
    REGISTERED: 'bg-blue-100 text-blue-700',
    WAITLISTED: 'bg-amber-100 text-amber-700',
    ATTENDED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-gray-100 text-gray-700',
  }

  const statusLabels: Record<string, string> = {
    REGISTERED: 'ลงทะเบียน',
    WAITLISTED: 'สำรอง',
    ATTENDED: 'เข้าร่วมแล้ว',
    CANCELLED: 'ยกเลิก',
    NO_SHOW: 'ไม่มา',
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-400 text-center animate-pulse">กำลังโหลดรายชื่อ...</div>
  }

  if (registrations.length === 0) {
    return <div className="p-4 text-sm text-gray-400 text-center">ยังไม่มีผู้ลงทะเบียน</div>
  }

  return (
    <div className="p-3">
      <div className="text-xs font-semibold text-gray-500 mb-2 px-1">ผู้ลงทะเบียน ({registrations.length} คน)</div>
      <div className="space-y-1.5">
        {registrations.map((reg) => (
          <div key={reg.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-gray-100 text-sm">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[var(--color-text)] text-sm">{reg.employee.fullName}</div>
              <div className="text-xs text-gray-400">{reg.employee.employeeCode} {reg.employee.branchCode && `• ${reg.employee.branchCode}`}</div>
            </div>
            <select
              value={reg.status}
              onChange={(e) => handleStatusChange(reg.id, e.target.value)}
              disabled={updating === reg.id}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border-0 cursor-pointer ${statusColors[reg.status] || 'bg-gray-100'} ${updating === reg.id ? 'opacity-50' : ''}`}
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
