import { NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { createAdminSession } from '@/lib/auth'

export async function POST(req: Request) {
  const ip = getClientIp(req)

  if (await isRateLimited(`admin_auth:${ip}`, 5, 3600)) {
    return NextResponse.json({ error: 'حاول مجدداً بعد ساعة' }, { status: 429 })
  }

  const { password } = await req.json()
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  if (!ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'كلمة مرور خاطئة' }, { status: 401 })
  }

  const token = await createAdminSession()

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   30 * 24 * 3600,
    path:     '/',
  })
  return res
}
