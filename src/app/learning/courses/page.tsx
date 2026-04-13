import { BookOpen } from 'lucide-react'

export default function LearningCoursesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">คอร์สของฉัน</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">รายการคอร์สที่ได้รับมอบหมาย</p>
      </div>

      <div className="stat-card p-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-[var(--color-text-secondary)]">เลือกคอร์สจากหน้าแดชบอร์ดเพื่อเริ่มเรียน</p>
      </div>
    </div>
  )
}
