import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const employee = await prisma.employee.findUnique({ where: { id } })
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Reset password to ddmmyyyy of date_of_birth
    const dob = employee.date_of_birth
    const dd = String(dob.getDate()).padStart(2, '0')
    const mm = String(dob.getMonth() + 1).padStart(2, '0')
    const yyyy = String(dob.getFullYear())
    const defaultPassword = `${dd}${mm}${yyyy}`
    const passwordHash = await bcrypt.hash(defaultPassword, 10)

    await prisma.employee.update({
      where: { id },
      data: { password_hash: passwordHash },
    })

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('[API] Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
