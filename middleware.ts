import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, verifyAdminSession } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin Dashboard ───────────────────────────────────────
  if (pathname.startsWith('/dashboard') && pathname !== '/dashboard/login') {
    const token = request.cookies.get('admin_token')?.value
    const valid = await verifyAdminSession(token)
    if (!valid) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
  }

  // ── Parent Portal ─────────────────────────────────────────
  const parentPublic = ['/parent/login', '/parent']
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

  // ── Session Platform (admin only) ─────────────────────────
  if (pathname.startsWith('/session')) {
    const token = request.cookies.get('admin_token')?.value
    const valid = await verifyAdminSession(token)
    if (!valid) {
      return NextResponse.redirect(new URL('/dashboard/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/parent/:path*', '/student/:path*', '/session/:path*'],
}
