import { NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { createAdminSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)

    if (await isRateLimited(`admin_auth:${ip}`, 5, 3600)) {
      return NextResponse.json({ error: 'حاول مجدداً بعد ساعة' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const { password } = body as { password?: string }
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim()

    if (!ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'not configured' }, { status: 503 })
    }

    if (!password || password !== ADMIN_PASSWORD) {
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
  } catch (err) {
    console.error('[admin-auth]', err)
    return NextResponse.json({ error: 'خطأ في الخادم، حاول مجدداً' }, { status: 500 })
  }
}
