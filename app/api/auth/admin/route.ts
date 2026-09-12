import { NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { createAdminSession } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { safeCompare } from '@/lib/password'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)

    const rl = await isRateLimited(`admin_auth:${ip}`, 10, 3600)
    if (rl.limited) {
      return rl.unavailable
        ? NextResponse.json({ error: 'الخدمة غير متوفرة مؤقتًا (تعذّر الاتصال بقاعدة البيانات) — راجع مفاتيح Upstash' }, { status: 503 })
        : NextResponse.json({ error: 'تم حظر المحاولات مؤقتاً (10 محاولات/ساعة). انتظر ساعة أو امسح المفتاح rl:admin_auth من Upstash' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const { password } = body as { password?: string }
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim()

    if (!ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD غير مضبوط في هذا النشر — أضفه على Production ثم أعد النشر (Redeploy)' }, { status: 503 })
    }

    // Trim the submitted value too: ADMIN_PASSWORD is already trimmed, so a
    // stray leading/trailing space (very easy to paste in) could never match
    // and produced a confusing "wrong password" for a correct secret.
    const submitted = password?.trim()
    if (!submitted || !safeCompare(submitted, ADMIN_PASSWORD)) {
      return NextResponse.json({ error: 'كلمة مرور خاطئة — إن كنت غيّرتها للتو في Vercel فأعد النشر (Redeploy) ليُطبَّق التغيير' }, { status: 401 })
    }

    const token = await createAdminSession()
    await audit({ action: 'login', actorId: 'admin', actorRole: 'admin', ip })

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
