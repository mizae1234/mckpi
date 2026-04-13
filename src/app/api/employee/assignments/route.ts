import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
// Force refresh type cache

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignments = await prisma.courseAssignment.findMany({
      where: { employee_id: session.user.id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            training_type: true,
            is_mandatory: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { due_date: 'asc' },
      ],
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('[API] Failed to fetch assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
