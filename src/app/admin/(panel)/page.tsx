import { prisma } from '@/lib/prisma'
import { Users, BookOpen, BarChart3, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [
    totalEmployees,
    totalCourses,
    totalAssignments,
    completedAssignments,
    totalResults,
    passedResults,
    failedResults,
    inProgressResults,
  ] = await Promise.all([
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    prisma.courseAssignment.count(),
    prisma.courseAssignment.count({ where: { status: 'COMPLETED' } }),
    prisma.trainingResult.count(),
    prisma.trainingResult.count({ where: { status: 'PASSED' } }),
    prisma.trainingResult.count({ where: { status: 'FAILED' } }),
    prisma.trainingResult.count({ where: { status: 'IN_PROGRESS' } }),
  ])

  // KPI Calculations
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
  const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0
  const notStarted = totalAssignments - completedAssignments - inProgressResults

  // Overdue count
  const overdueCount = await prisma.courseAssignment.count({
    where: {
      status: { not: 'COMPLETED' },
      dueDate: { lt: new Date() },
    },
  })
  const overdueRate = totalAssignments > 0 ? Math.round((overdueCount / totalAssignments) * 100) : 0

  const stats = [
    {
      icon: Users,
      label: 'พนักงานทั้งหมด',
      value: totalEmployees,
      color: 'bg-blue-50 text-blue-600',
      subtext: `ที่ใช้งานอยู่`,
    },
    {
      icon: TrendingUp,
      label: 'Completion Rate',
      value: `${completionRate}%`,
      color: 'bg-green-50 text-green-600',
      subtext: `${completedAssignments} จาก ${totalAssignments} งาน`,
    },
    {
      icon: CheckCircle2,
      label: 'Pass Rate',
      value: `${passRate}%`,
      color: 'bg-amber-50 text-amber-600',
      subtext: `${passedResults} ผ่าน จาก ${totalResults} ผล`,
    },
    {
      icon: AlertTriangle,
      label: 'Overdue',
      value: `${overdueRate}%`,
      color: 'bg-red-50 text-red-600',
      subtext: `${overdueCount} งานเลยกำหนด`,
    },
  ]

  const statusBreakdown = [
    { label: 'ยังไม่เริ่ม', count: notStarted > 0 ? notStarted : 0, color: 'bg-gray-400', pct: totalAssignments > 0 ? ((notStarted > 0 ? notStarted : 0) / totalAssignments) * 100 : 0 },
    { label: 'กำลังเรียน', count: inProgressResults, color: 'bg-amber-400', pct: totalAssignments > 0 ? (inProgressResults / totalAssignments) * 100 : 0 },
    { label: 'ผ่านแล้ว', count: passedResults, color: 'bg-green-500', pct: totalAssignments > 0 ? (passedResults / totalAssignments) * 100 : 0 },
    { label: 'ไม่ผ่าน', count: failedResults, color: 'bg-red-500', pct: totalAssignments > 0 ? (failedResults / totalAssignments) * 100 : 0 },
    { label: 'เลยกำหนด', count: overdueCount, color: 'bg-orange-500', pct: totalAssignments > 0 ? (overdueCount / totalAssignments) * 100 : 0 },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">แดชบอร์ด KPI</h1>
        <p className="text-[var(--color-text-secondary)] text-sm">ภาพรวมระบบอบรมพนักงาน MKPI</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm text-[var(--color-text-secondary)]">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-[var(--color-text)]">{stat.value}</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="stat-card p-6">
        <h2 className="font-bold text-[var(--color-text)] mb-4">สัดส่วนตามสถานะ</h2>
        <div className="space-y-4">
          {statusBreakdown.map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="text-[var(--color-text)] font-semibold">{item.count} งาน ({Math.round(item.pct)}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-[var(--color-text)]">คอร์สที่เปิดสอน</h2>
          </div>
          <div className="text-4xl font-bold text-[var(--color-text)]">{totalCourses}</div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">คอร์สที่ Published อยู่ในระบบ</p>
        </div>

        <div className="stat-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-[var(--color-text)]">งานที่มอบหมาย</h2>
          </div>
          <div className="text-4xl font-bold text-[var(--color-text)]">{totalAssignments}</div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">งานทั้งหมดในระบบ</p>
        </div>
      </div>
    </div>
  )
}
