import KpiClient from './KpiClient'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function KpisPage() {
  const kpis = await prisma.kpi.findMany({
    include: {
      courses: {
        include: {
          course: { select: { id: true, code: true, title: true, trainingType: true } },
        },
      },
    },
    orderBy: [{ year: 'desc' }, { code: 'asc' }],
  })

  // Get unique years
  const years = [...new Set(kpis.map(k => k.year))].sort((a, b) => b - a)
  const currentYear = new Date().getFullYear()
  if (!years.includes(currentYear)) {
    years.unshift(currentYear)
  }

  return <KpiClient initialKpis={kpis} availableYears={years} />
}
