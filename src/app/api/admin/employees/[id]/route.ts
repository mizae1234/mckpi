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
    const { fullName, position, department, branchCode, dateOfBirth, startDate, status } = body

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        fullName: fullName || undefined,
        positionCode: position ?? undefined,
        departmentCode: department ?? undefined,
        branchCode: branchCode ?? undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        status: status || undefined,
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('[API] Update employee error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
