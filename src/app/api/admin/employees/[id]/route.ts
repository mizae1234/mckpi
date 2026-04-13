import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const employee = await prisma.employee.findUnique({ where: { id } })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(employee)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { full_name, position, department, branch, date_of_birth, start_date, status } = body

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        full_name: full_name || undefined,
        position: position ?? undefined,
        department: department ?? undefined,
        branch: branch ?? undefined,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
        start_date: start_date ? new Date(start_date) : undefined,
        status: status || undefined,
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('[API] Update employee error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
