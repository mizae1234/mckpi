import { prisma } from '@/lib/prisma'
import { CalendarCheck } from 'lucide-react'
import CreateSessionButton from './CreateSessionButton'

export const dynamic = 'force-dynamic'

export default async function SessionsPage() {
  const sessions = await prisma.offlineSession.findMany({
    include: {
      course: { select: { code: true, title: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { sessionDate: 'desc' },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">รอบอบรม Offline</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">จัดการรอบการอบรมในห้องเรียน</p>
        </div>
        <CreateSessionButton />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>คอร์ส</th>
              <th>วันที่</th>
              <th>สถานที่</th>
              <th>วิทยากร</th>
              <th>ผู้ลงทะเบียน</th>
              <th>ความจุ</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <CalendarCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-[var(--color-text-secondary)]">ยังไม่มีรอบอบรม</p>
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="font-medium">{s.course.title}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{s.course.code}</div>
                  </td>
                  <td>{s.sessionDate.toLocaleDateString('th-TH', { dateStyle: 'long' })}</td>
                  <td>{s.location || '-'}</td>
                  <td>{s.trainerName || '-'}</td>
                  <td>
                    <span className="font-semibold">{s._count.registrations}</span>
                  </td>
                  <td>{s.capacity} คน</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
