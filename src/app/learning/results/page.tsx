import { BarChart3 } from 'lucide-react'

export default function ResultsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">ผลลัพธ์ของฉัน</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">ประวัติผลการอบรมทั้งหมด</p>
      </div>

      <div className="stat-card p-12 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-[var(--color-text-secondary)]">ยังไม่มีผลการอบรม</p>
      </div>
    </div>
  )
}
