import { Suspense } from 'react'
import { FileBarChart2 } from 'lucide-react'
import OnboardingReportClient from './OnboardingReportClient'

export const dynamic = 'force-dynamic'

export default function OnboardingReportPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
          <FileBarChart2 className="w-7 h-7 text-primary" />
          KPI การอบรมพนักงานใหม่
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          ติดตามสถานะการอบรมพนักงานใหม่ตามกำหนดเวลา แยกตามสาขา — หากสาขาใดมีพนักงานอบรมเกินกำหนดแม้แต่ 1 คน ถือว่าไม่ผ่าน KPI
        </p>
      </div>

      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <OnboardingReportClient />
      </Suspense>
    </div>
  )
}
