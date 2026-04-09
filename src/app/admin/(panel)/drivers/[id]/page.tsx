import { prisma } from '@/lib/prisma'
import { maskNationalId, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, User, PlayCircle, ClipboardCheck, Award, Phone, Calendar, Hash } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      video_progress: { include: { video: true } },
      quiz_attempts: { orderBy: { created_at: 'desc' } },
      certificates: { orderBy: { issued_at: 'desc' } },
    },
  })

  if (!driver) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ไม่พบข้อมูลคนขับ</p>
        <Link href="/admin/drivers" className="btn-secondary mt-4 inline-flex">กลับ</Link>
      </div>
    )
  }

  const videoProgress = driver.video_progress[0]
  const videoPct = videoProgress && videoProgress.total_duration > 0
    ? Math.round((videoProgress.max_watched_time / videoProgress.total_duration) * 100)
    : 0

  const statusBadge = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return <span className="badge badge-gray">ยังไม่เริ่ม</span>
      case 'WATCHING': return <span className="badge badge-warning">กำลังดูวิดีโอ</span>
      case 'PASSED': return <span className="badge badge-success">ผ่านการอบรม</span>
      default: return <span className="badge badge-gray">{status}</span>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Link href="/admin/drivers" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        กลับหน้ารายชื่อ
      </Link>

      {/* Profile */}
      <div className="stat-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl font-bold">
            {driver.full_name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{driver.full_name}</h1>
              {statusBadge(driver.onboarding_status)}
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Hash className="w-4 h-4" />
                <span className="font-mono">{driver.national_id}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                {formatDate(driver.date_of_birth)}
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Phone className="w-4 h-4" />
                {driver.phone || '-'}
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <User className="w-4 h-4" />
                สร้างเมื่อ {formatDate(driver.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Progress */}
      <div className="stat-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <PlayCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">ความคืบหน้าวิดีโอ</h2>
            <p className="text-xs text-gray-400">{videoProgress?.completed ? 'ดูครบแล้ว' : 'ยังดูไม่ครบ'}</p>
          </div>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full ${videoPct >= 95 ? 'bg-ev7-500' : 'bg-blue-500'}`}
            style={{ width: `${videoPct}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">{videoPct}% จากที่ต้องดู 95%</p>
      </div>

      {/* Quiz Attempts */}
      <div className="stat-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">ประวัติการสอบ</h2>
            <p className="text-xs text-gray-400">{driver.quiz_attempts.length} ครั้ง</p>
          </div>
        </div>
        {driver.quiz_attempts.length === 0 ? (
          <p className="text-gray-400 text-sm">ยังไม่มีการสอบ</p>
        ) : (
          <div className="space-y-2">
            {driver.quiz_attempts.map((a: { id: string; attempt_no: number; passed: boolean; score: number }) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">ครั้งที่ {a.attempt_no}</span>
                  <span className={`badge ${a.passed ? 'badge-success' : 'badge-danger'}`}>
                    {a.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                  </span>
                </div>
                <span className="font-bold text-gray-900">{Math.round(a.score)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      <div className="stat-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Certificate</h2>
            <p className="text-xs text-gray-400">{driver.certificates.length} ใบ</p>
          </div>
        </div>
        {driver.certificates.length === 0 ? (
          <p className="text-gray-400 text-sm">ยังไม่มี Certificate</p>
        ) : (
          <div className="space-y-2">
            {driver.certificates.map((c: { id: string; certificate_no: string; issued_at: Date; status: string }) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-mono text-sm font-semibold text-gray-900">{c.certificate_no}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.issued_at)}</p>
                </div>
                <span className={`badge ${c.status === 'VALID' ? 'badge-success' : 'badge-danger'}`}>
                  {c.status === 'VALID' ? 'ใช้งานได้' : 'เพิกถอน'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
