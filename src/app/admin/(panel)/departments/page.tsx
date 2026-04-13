import { Building2 } from 'lucide-react'

export default function DepartmentsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">จัดการแผนก (Departments)</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">ตั้งค่าและจัดการโครงสร้างแผนก</p>
      </div>

      <div className="stat-card p-12 text-center">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-[var(--color-text-secondary)]">หน้านี้กำลังอยู่ระหว่างการพัฒนา</p>
      </div>
    </div>
  )
}
