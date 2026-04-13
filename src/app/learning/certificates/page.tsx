import { Award } from 'lucide-react'

export default function CertificatesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">ใบรับรองของฉัน</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">ดาวน์โหลด Certificate</p>
      </div>

      <div className="stat-card p-12 text-center">
        <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-[var(--color-text-secondary)]">ยังไม่มีใบรับรอง</p>
      </div>
    </div>
  )
}
