import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BarChart3, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ResultsPage() {
  const session = await auth()
  if (!session?.user) return redirect('/login')

  const results = await prisma.trainingResult.findMany({
    where: { employeeId: session.user.id },
    include: {
      course: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Format date safely
  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">ประวัติการอบรม</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">รวมผลการอบรมทั้งหมดของคุณทั้งแบบ Online และ Offline</p>
      </div>

      {results.length === 0 ? (
        <div className="stat-card p-12 text-center rounded-2xl border border-[var(--color-border)] bg-white">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)]">ยังไม่มีประวัติการอบรมในระบบ</p>
        </div>
      ) : (
        <div className="bg-white border text-sm border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-[var(--color-border)]">
                  <th className="p-4 font-semibold text-gray-600">วิชาหลักสูตร</th>
                  <th className="p-4 font-semibold text-gray-600 text-center">ประเภท</th>
                  <th className="p-4 font-semibold text-gray-600 text-center">สถานะ</th>
                  <th className="p-4 font-semibold text-gray-600 text-center">คะแนนล่าสุด</th>
                  <th className="p-4 font-semibold text-gray-600">วันที่สำเร็จ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-[var(--color-text)]">{result.course.title}</div>
                      <Link href={`/learning/courses/${result.courseId}`} className="text-xs text-primary hover:underline mt-1 block">
                        ดูรายละเอียดคอร์ส
                      </Link>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${result.source === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {result.source}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        {result.status === 'PASSED' ? (
                          <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ผ่าน
                          </div>
                        ) : result.status === 'FAILED' ? (
                          <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-medium">
                            <XCircle className="w-3.5 h-3.5" /> ไม่ผ่าน
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-medium">
                            <Clock className="w-3.5 h-3.5" /> กำลังเรียน
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-700">
                      {result.score !== null ? `${result.score}%` : '-'}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {formatDate(result.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
