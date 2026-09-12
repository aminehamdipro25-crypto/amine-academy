import { NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { createAdminSession } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { redis } from '@/lib/redis'
import { recoveryKey } from '@/lib/admin-recovery'

export const runtime = 'nodejs'

/** Consume a one-time recovery token and mint a normal admin session. */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)

    const rl = await isRateLimited(`admin_recover_verify:${ip}`, 10, 3600)
    if (rl.limited) {
      return rl.unavailable
        ? NextResponse.json({ error: 'الخدمة غير متوفرة مؤقتًا (تعذّر الاتصال بقاعدة البيانات)' }, { status: 503 })
        : NextResponse.json({ error: 'محاولات كثيرة — حاول لاحقاً' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const { token } = body as { token?: string }
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'رابط غير صالح' }, { status: 400 })
    }

    // GETDEL consumes the token atomically, so a link can't be redeemed twice
    // even if it is opened concurrently (e.g. a mail client prefetch racing the
    // real click).
    const results = await redis.pipeline([['GETDEL', recoveryKey(token)]])
    const found = results[0]?.result
    if (!found) {
      return NextResponse.json({ error: 'انتهت صلاحية الرابط أو استُخدم من قبل — اطلب رابطاً جديداً' }, { status: 400 })
    }

    const sessionToken = await createAdminSession()
    await audit({ action: 'login', actorId: 'admin-recovery', actorRole: 'admin', ip })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('admin_token', sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 3600,
      path:     '/',
    })
    return res
  } catch (err) {
    console.error('[admin-recover-verify]', err)
    return NextResponse.json({ error: 'خطأ في الخادم، حاول مجدداً' }, { status: 500 })
  }
}
