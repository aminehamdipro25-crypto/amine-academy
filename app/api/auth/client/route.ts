import { NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { createSession } from '@/lib/auth'
import { getParentByEmail } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

export async function POST(req: Request) {
  const ip = getClientIp(req)

  if (await isRateLimited(`client_auth:${ip}`, 10, 3600)) {
    return NextResponse.json({ error: 'حاول مجدداً بعد ساعة' }, { status: 429 })
  }

  const { email, password, role, code } = await req.json()

  if (role === 'parent') {
    if (!email || !password) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 })
    }
    const parent = await getParentByEmail(email)
    if (!parent || !verifyPassword(password, parent.passwordHash)) {
      return NextResponse.json({ error: 'البريد أو كلمة المرور غير صحيحة' }, { status: 401 })
    }
    if (parent.subscriptionStatus === 'suspended') {
      return NextResponse.json({ error: 'حسابك موقوف. تواصل مع الأكاديمية.' }, { status: 403 })
    }

    const token = await createSession(parent.id, 'parent')
    const res = NextResponse.json({ ok: true, id: parent.id })
    res.cookies.set('parent_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 3600,
      path:     '/',
    })
    return res
  }

  // student login by access code
  if (role === 'student') {
    if (!code) return NextResponse.json({ error: 'أدخل رمز الدخول' }, { status: 400 })
    // TODO: verify student code from Redis
    return NextResponse.json({ error: 'رمز الدخول غير صحيح' }, { status: 401 })
  }

  return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })
}
