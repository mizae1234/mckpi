import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/auth-edge'

export default async function middleware(request: NextRequest) {
  const session = await authMiddleware()
  const { pathname } = request.nextUrl

  // Public routes - always allow
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/admin/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (!session || (session.user as { role?: string })?.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // Employee routes (learning)
  if (pathname.startsWith('/learning')) {
    if (!session || (session.user as { role?: string })?.role !== 'employee') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // API routes protection
  if (pathname.startsWith('/api/admin')) {
    if (!session || (session.user as { role?: string })?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/api/courses') ||
    pathname.startsWith('/api/assignments') ||
    pathname.startsWith('/api/results') ||
    pathname.startsWith('/api/employee')
  ) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
