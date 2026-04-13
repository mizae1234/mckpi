import { CalendarCheck } from 'lucide-react'

export default function OfflineTrainingPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">อบรม Offline</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">ดูรอบอบรมและลงทะเบียน</p>
      </div>

      <div className="stat-card p-12 text-center">
        <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-[var(--color-text-secondary)]">ยังไม่มีรอบ Offline ที่เปิดให้ลงทะเบียน</p>
      </div>
    </div>
  )
}
