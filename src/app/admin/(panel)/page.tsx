import { prisma } from '@/lib/prisma'
import { Users, BookOpen, CheckCircle2, AlertTriangle, TrendingUp, Calendar, UserCheck, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [
    totalEmployees,
    totalAssignments,
    completedAssignments,
    totalResults,
    passedResults,
    overdueCount,
  ] = await Promise.all([
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.courseAssignment.count(),
    prisma.courseAssignment.count({ where: { status: 'COMPLETED' } }),
    prisma.trainingResult.count(),
    prisma.trainingResult.count({ where: { status: 'PASSED' } }),
    prisma.courseAssignment.count({
      where: { status: { not: 'COMPLETED' }, dueDate: { lt: new Date() } },
    }),
  ])

  // Fetch published courses with session + registration counts
  const publishedCourses = await prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      sessions: {
        include: {
          _count: { select: { registrations: true } },
        },
        orderBy: { sessionDate: 'asc' },
      },
      _count: {
        select: {
          assignments: true,
          results: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // KPI Calculations
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
  const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0
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

      {/* Published Courses Table */}
      <div className="stat-card overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-[var(--color-text)]">คอร์สที่เปิดสอนอยู่</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">{publishedCourses.length} คอร์สที่ Published</p>
              </div>
            </div>
            <Link href="/admin/courses" className="text-sm text-primary hover:underline font-medium">ดูทั้งหมด →</Link>
          </div>
        </div>

        {publishedCourses.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">ยังไม่มีคอร์สที่ Publish</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-left text-xs text-gray-500 font-semibold">
                  <th className="px-6 py-3">คอร์ส</th>
                  <th className="px-6 py-3 text-center">ประเภท</th>
                  <th className="px-6 py-3 text-center">รอบอบรม</th>
                  <th className="px-6 py-3 text-center">ลงทะเบียน</th>
                  <th className="px-6 py-3 text-center">ที่เปิดรับ</th>
                  <th className="px-6 py-3 text-center">สำรอง</th>
                  <th className="px-6 py-3 text-center">ผลลัพธ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {publishedCourses.map((course) => {
                  const totalCapacity = course.sessions.reduce((sum, s) => sum + s.capacity, 0)
                  const totalWaitlist = course.sessions.reduce((sum, s) => sum + s.waitlistCapacity, 0)
                  const totalRegistered = course.sessions.reduce((sum, s) => sum + s._count.registrations, 0)

                  return (
                    <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <Link href={`/admin/courses/${course.id}`} className="hover:text-primary transition-colors">
                          <div className="font-medium text-[var(--color-text)]">{course.title}</div>
                          <div className="text-xs text-gray-400 font-mono">{course.code}</div>
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${
                          course.trainingType === 'ONLINE' ? 'bg-blue-100 text-blue-700' :
                          course.trainingType === 'OFFLINE' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {course.trainingType}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-semibold">{course.sessions.length}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-green-500" />
                          <span className="font-bold text-[var(--color-text)]">{totalRegistered}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {totalCapacity > 0 ? (
                          <div>
                            <span className="font-semibold text-gray-700">{totalCapacity}</span>
                            <span className="text-gray-400 text-xs"> คน</span>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {totalWaitlist > 0 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-600">
                            +{totalWaitlist}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="font-semibold text-green-600">{course._count.results}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
