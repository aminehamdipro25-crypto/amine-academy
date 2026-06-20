import { NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { createStaffSession } from '@/lib/auth'
import { getStaffByEmail, updateStaff } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)

    const rl = await isRateLimited(`staff_auth:${ip}`, 5, 3600)
    if (rl.limited) {
      return rl.unavailable
        ? NextResponse.json({ error: 'الخدمة غير متوفرة مؤقتًا، يرجى المحاولة بعد قليل' }, { status: 503 })
        : NextResponse.json({ error: 'حاول مجدداً بعد ساعة' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const { email, password } = body as { email?: string; password?: string }
    if (!email || !password) {
      return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const staff = await getStaffByEmail(email)
    if (!staff || !staff.isActive || !verifyPassword(password, staff.passwordHash)) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 401 })
    }

    const token = await createStaffSession(staff.id)
    await updateStaff(staff.id, { lastLoginAt: new Date().toISOString() })

    const res = NextResponse.json({ ok: true, name: staff.name })
    res.cookies.set('staff_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 3600,
      path:     '/',
    })
    return res
  } catch (err) {
    console.error('[staff-auth]', err)
    return NextResponse.json({ error: 'خطأ في الخادم، حاول مجدداً' }, { status: 500 })
  }
}
