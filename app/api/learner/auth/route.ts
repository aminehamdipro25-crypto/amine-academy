import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { getLearnerByEmail, updateLearner } from '@/lib/language-learners'
import { verifyPassword } from '@/lib/password'
import { createLearnerSession, revokeLearnerSession, verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const rl = await isRateLimited(`learner_auth:${ip}`, 6, 3600)
    if (rl.limited) {
      return NextResponse.json({ error: rl.unavailable ? 'الخدمة غير متوفرة مؤقتاً' : 'حاول مجدداً بعد قليل' }, { status: rl.unavailable ? 503 : 429 })
    }
    const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string }
    if (!email || !password) return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })

    const learner = await getLearnerByEmail(email)
    if (!learner || !verifyPassword(password, learner.passwordHash)) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 401 })
    }

    const token = await createLearnerSession(learner.id)
    await updateLearner(learner.id, { lastLoginAt: new Date().toISOString() })

    const res = NextResponse.json({ ok: true, name: learner.name })
    res.cookies.set(LEARNER_COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/',
    })
    return res
  } catch (e) {
    console.error('[learner-auth POST]', e)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const store = await cookies()
    const payload = await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value)
    if (payload) await revokeLearnerSession(payload.id)
    const res = NextResponse.json({ ok: true })
    res.cookies.set(LEARNER_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
    return res
  } catch {
    return NextResponse.json({ ok: true })
  }
}
