import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, verifyAdminSession, verifyStaffSession } from './lib/auth'

// Pages reserved for the owner — staff accounts must not reach these
// even though they share the /dashboard prefix with staff-accessible pages.
const OWNER_ONLY_PAGES = ['/dashboard/payments', '/dashboard/analytics', '/dashboard/staff', '/dashboard/settings']

async function isOwnerAuthorized(request: NextRequest): Promise<boolean> {
  const adminToken = request.cookies.get('admin_token')?.value
  return verifyAdminSession(adminToken)
}

async function isDashboardAuthorized(request: NextRequest): Promise<boolean> {
  if (await isOwnerAuthorized(request)) return true
  const staffToken = request.cookies.get('staff_token')?.value
  return !!(await verifyStaffSession(staffToken))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin Dashboard (owner or staff) ──────────────────────
  if (pathname.startsWith('/dashboard') && pathname !== '/dashboard/login') {
    const ownerOnly = OWNER_ONLY_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'))
    const authorized = ownerOnly ? await isOwnerAuthorized(request) : await isDashboardAuthorized(request)
    if (!authorized) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
  }

  // ── Parent Portal ─────────────────────────────────────────
  const parentPublic = ['/parent/login', '/parent', '/parent/forgot-password', '/parent/reset-password']
  if (pathname.startsWith('/parent') && !parentPublic.includes(pathname)) {
    const token   = request.cookies.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      const res = NextResponse.redirect(new URL('/parent/login', request.url))
      res.cookies.set('parent_token', '', { maxAge: 0, path: '/' })
      return res
    }
  }

  // ── Student Portal ────────────────────────────────────────
  const studentPublic = ['/student/login', '/student']
  if (pathname.startsWith('/student') && !studentPublic.includes(pathname)) {
    const token   = request.cookies.get('student_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'student') {
      const res = NextResponse.redirect(new URL('/student/login', request.url))
      res.cookies.set('student_token', '', { maxAge: 0, path: '/' })
      return res
    }
  }

  // ── Session Platform (owner or staff) ─────────────────────
  if (pathname.startsWith('/session')) {
    if (!(await isDashboardAuthorized(request))) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/parent/:path*', '/student/:path*', '/session/:path*'],
}
