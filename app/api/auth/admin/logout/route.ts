import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revokeAdminSession } from '@/lib/auth'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (token) await revokeAdminSession(token)

  const res = NextResponse.redirect(new URL('/dashboard/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  res.cookies.set('admin_token', '', { maxAge: 0, path: '/' })
  return res
}
