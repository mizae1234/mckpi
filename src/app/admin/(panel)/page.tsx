import { prisma } from '@/lib/prisma'
import { Users, PlayCircle, ClipboardCheck, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [totalDrivers, watchedVideo, passedQuiz, totalCerts] = await Promise.all([
    prisma.driver.count(),
    prisma.videoProgress.count({ where: { completed: true } }),
    prisma.driver.count({ where: { onboarding_status: 'PASSED' } }),
    prisma.certificate.count({ where: { status: 'VALID' } }),
  ])

  const [statusNotStarted, statusWatching, statusPassed] = await Promise.all([
    prisma.driver.count({ where: { onboarding_status: 'NOT_STARTED' } }),
    prisma.driver.count({ where: { onboarding_status: 'WATCHING' } }),
    prisma.driver.count({ where: { onboarding_status: 'PASSED' } }),
  ])

  const watchedPct = totalDrivers > 0 ? Math.round((watchedVideo / totalDrivers) * 100) : 0
  const passedPct = totalDrivers > 0 ? Math.round((passedQuiz / totalDrivers) * 100) : 0

  const stats = [
    { 
      icon: Users, 
      label: 'คนขับทั้งหมด', 
      value: totalDrivers, 
      color: 'bg-blue-50 text-blue-600',
      subtext: `ใช้งาน ${totalDrivers} คน`,
    },
    { 
      icon: PlayCircle, 
      label: 'ดูวิดีโอแล้ว', 
      value: `${watchedPct}%`, 
      color: 'bg-amber-50 text-amber-600',
      subtext: `${watchedVideo} จาก ${totalDrivers} คน`,
    },
    { 
      icon: ClipboardCheck, 
      label: 'สอบผ่าน', 
      value: `${passedPct}%`, 
      color: 'bg-ev7-50 text-ev7-600',
      subtext: `${passedQuiz} จาก ${totalDrivers} คน`,
    },
    { 
      icon: Award, 
      label: 'Certificate', 
      value: totalCerts, 
      color: 'bg-purple-50 text-purple-600',
      subtext: 'ใบรับรองที่ออกแล้ว',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-500 text-sm">ภาพรวมระบบอบรม EV7</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="stat-card p-6">
        <h2 className="font-bold text-gray-900 mb-4">สัดส่วนตามสถานะ</h2>
        <div className="space-y-4">
          {[
            { label: 'ยังไม่เริ่ม', count: statusNotStarted, color: 'bg-gray-300', pct: totalDrivers > 0 ? (statusNotStarted / totalDrivers) * 100 : 0 },
            { label: 'กำลังดูวิดีโอ', count: statusWatching, color: 'bg-amber-400', pct: totalDrivers > 0 ? (statusWatching / totalDrivers) * 100 : 0 },
            { label: 'สอบผ่านแล้ว', count: statusPassed, color: 'bg-ev7-500', pct: totalDrivers > 0 ? (statusPassed / totalDrivers) * 100 : 0 },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="text-gray-900 font-semibold">{item.count} คน ({Math.round(item.pct)}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
