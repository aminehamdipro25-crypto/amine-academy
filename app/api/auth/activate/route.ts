import { NextRequest, NextResponse } from 'next/server'
import { verifyActivationCode, deleteActivationCode, getParentByEmail, updateParent } from '@/lib/db'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // 10 attempts per 15 minutes per IP — prevents brute-forcing the 6-digit code
    const ip = getClientIp(req)
    const rl = await isRateLimited(`activate:${ip}`, 10, 900)
    if (rl.limited) {
      return NextResponse.json(
        { error: rl.unavailable ? 'الخدمة غير متوفرة مؤقتاً' : 'حاولت كثيراً. انتظر 15 دقيقة وحاول مجدداً.' },
        { status: rl.unavailable ? 503 : 429 }
      )
    }

    const { email, code } = await req.json().catch(() => ({}))
    if (!email || !code) {
      return NextResponse.json({ error: 'البريد والرمز مطلوبان' }, { status: 400 })
    }

    const valid = await verifyActivationCode(email.trim().toLowerCase(), String(code).trim())
    if (!valid) {
      return NextResponse.json({ error: 'رمز التفعيل غير صحيح أو منتهي الصلاحية' }, { status: 400 })
    }

    const parent = await getParentByEmail(email)
    if (!parent) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 })
    }

    // Mark the email as verified (isActive), and — for the pending-on-signup
    // case — open portal access. Login stays gated until this runs, so email
    // verification is mandatory before any account can be used.
    await updateParent(parent.id, {
      emailVerified: true,
      ...(parent.subscriptionStatus === 'pending' ? { subscriptionStatus: 'active' as const } : {}),
    })

    await deleteActivationCode(email)

    return NextResponse.json({ ok: true, message: 'تم تفعيل حسابك بنجاح!' })
  } catch (e) {
    console.error('[activate]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
