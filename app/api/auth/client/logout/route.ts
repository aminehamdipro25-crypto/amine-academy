import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, revokeSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST() {
  // Actually kill the server-side session, not just the cookie — otherwise a
  // copied/stolen token stays valid for up to 30 days after "logout".
  const store = await cookies()
  const parentPayload  = await verifyToken(store.get('parent_token')?.value)
  const studentPayload = await verifyToken(store.get('student_token')?.value)
  if (parentPayload)  await revokeSession(parentPayload.id)
  if (studentPayload) await revokeSession(studentPayload.id)

  const res = NextResponse.redirect(new URL('/parent/login', process.env.NEXT_PUBLIC_BASE_URL ?? 'https://amine-academy.vercel.app'), 303)
  res.cookies.set('parent_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  res.cookies.set('student_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return res
}
