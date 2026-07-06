import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyStaffSession, revokeStaffSession } from '@/lib/auth'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('staff_token')?.value
  const staff = await verifyStaffSession(token)
  if (staff) await revokeStaffSession(staff.staffId)

  const res = NextResponse.redirect(new URL('/dashboard/login', process.env.NEXT_PUBLIC_BASE_URL ?? 'https://amine-academy.vercel.app'), 303)
  res.cookies.set('staff_token', '', { maxAge: 0, path: '/' })
  return res
}
