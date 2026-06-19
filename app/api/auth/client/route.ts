import { NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { createSession } from '@/lib/auth'
import { getParentByEmail } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)

    const rl = await isRateLimited(`client_auth:${ip}`, 20, 3600)
    if (rl.limited) {
      return rl.unavailable
        ? NextResponse.json({ error: 'الخدمة غير متوفرة مؤقتًا، يرجى المحاولة بعد قليل' }, { status: 503 })
        : NextResponse.json({ error: 'حاول مجدداً بعد ساعة' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const { email, password, role, code } = body as {
      email?: string; password?: string; role?: string; code?: string
    }

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

    if (role === 'student') {
      if (!code) return NextResponse.json({ error: 'أدخل رمز الدخول' }, { status: 400 })
      const studentId = await redis.get<string>(`student_code:${String(code).trim().toUpperCase()}`)
      if (!studentId) return NextResponse.json({ error: 'رمز الدخول غير صحيح أو منتهي الصلاحية' }, { status: 401 })
      const token = await createSession(studentId, 'student')
      const res = NextResponse.json({ ok: true })
      res.cookies.set('student_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 3600,
        path: '/',
      })
      return res
    }

    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })
  } catch (err) {
    const msg = (err as Error).message || 'unknown'
    console.error('[client-auth]', msg)
    return NextResponse.json({ error: `خطأ في الخادم: ${msg}` }, { status: 500 })
  }
}
