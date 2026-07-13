import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, verifyAdminSession, verifyStaffSession } from './lib/auth'

// Pages reserved for the owner — staff accounts must not reach these
// even though they share the /dashboard prefix with staff-accessible pages.
const OWNER_ONLY_PAGES = ['/dashboard/payments', '/dashboard/analytics', '/dashboard/staff', '/dashboard/settings']

// Interim mitigation for GHSA-3g8h-86w9-wvmq (Next.js middleware redirects can
// be cache-poisoned via a spoofed x-nextjs-data header) — the full fix requires
// Next.js 15.5.16+/16.2.5+, a major-version jump not attempted this close to
// launch. Marking every middleware redirect non-cacheable closes the practical
// attack: a shared/CDN cache can never store a poisoned Location for these auth
// redirects if the response itself forbids caching. Remove once Next.js is
// upgraded past the patched versions.
function authRedirect(url: string | URL): NextResponse {
  const res = NextResponse.redirect(url)
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  return res
}

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
      return authRedirect(new URL('/dashboard/login', request.url))
    }
  }

  // ── Parent Portal ─────────────────────────────────────────
  const parentPublic = ['/parent/login', '/parent', '/parent/forgot-password', '/parent/reset-password']
  if (pathname.startsWith('/parent') && !parentPublic.includes(pathname)) {
    const token   = request.cookies.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      const res = authRedirect(new URL('/parent/login', request.url))
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
      const res = authRedirect(new URL('/student/login', request.url))
      res.cookies.set('student_token', '', { maxAge: 0, path: '/' })
      return res
    }
  }

  // ── Session Platform ──────────────────────────────────────
  // /session/[id]/kid  → parent must be logged in (parent_token)
  // /session/[id]      → specialist/staff must be logged in (admin/staff token)
  if (pathname.match(/^\/session\/[^/]+\/kid$/)) {
    const token   = request.cookies.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      const redirect = encodeURIComponent(pathname)
      return authRedirect(new URL(`/parent/login?redirect=${redirect}`, request.url))
    }
  } else if (pathname.startsWith('/session')) {
    if (!(await isDashboardAuthorized(request))) {
      return authRedirect(new URL('/dashboard/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/parent/:path*', '/student/:path*', '/session/:path*'],
}
