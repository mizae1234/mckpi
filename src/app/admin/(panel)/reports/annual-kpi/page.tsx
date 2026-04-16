import { prisma } from '@/lib/prisma'
import AnnualKpiClient from './AnnualKpiClient'

export const dynamic = 'force-dynamic'

export default async function AnnualKpiPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const year = params.year ? parseInt(params.year) : currentYear

  // ดึงปีทั้งหมดที่มีใน KPI มารวมให้เลือก
  const kpiYears = await prisma.kpi.findMany({
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' }
  })
  
  const availableYears = kpiYears.map(k => k.year)
  if (!availableYears.includes(currentYear)) {
    availableYears.push(currentYear)
    availableYears.sort((a, b) => b - a)
  }

  // เรียก API เพื่อดึงข้อมูลรายงาน (ผ่าน fetch ภายใน Server Component)
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/admin/reports/annual-kpi?year=${year}`, {
    cache: 'no-store',
    headers: {
      cookie: `next-auth.session-token=mock` // We might not be able to fetch protected API here easily without forwarding cookies context, so Let's fetch directly using Prisma logic or pass initialData to Client?
    }
  })

  // To avoid NextAuth cookie forwarding issues in RSC, I will pass the year and fetch it on the client side.
  // Alternatively, just render the client component and let it fetch.
  return (
    <AnnualKpiClient initialYear={year} availableYears={availableYears} />
  )
}
