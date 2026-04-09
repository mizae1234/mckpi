import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cert = await prisma.certificate.findFirst({
    where: { driver_id: session.user.id, status: 'VALID' },
    include: { driver: { select: { full_name: true, national_id: true } } },
    orderBy: { issued_at: 'desc' },
  })

  if (!cert) {
    return NextResponse.json({ error: 'No certificate' }, { status: 404 })
  }

  return NextResponse.json({
    certificate_no: cert.certificate_no,
    score: cert.score,
    issued_at: cert.issued_at,
    driver_name: cert.driver.full_name,
    national_id: cert.driver.national_id,
  })
}
