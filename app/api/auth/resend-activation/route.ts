import { NextRequest, NextResponse } from 'next/server'
import { getParentByEmail, createActivationCode } from '@/lib/db'
import { sendEmail, welcomeParentEmail } from '@/lib/mailer'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// Resend the email activation code. Two independent rate limits — per IP and
// per target email — so this can't be abused to flood someone's inbox. The
// response is always the same generic success so it can't be used to probe
// which emails have accounts (no account enumeration).
const GENERIC = { ok: true, message: 'إن كان بريدك مسجّلاً ولم يُفعّل بعد، أرسلنا رمز تفعيل جديداً إليه.' }

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rlIp = await isRateLimited(`resend_activation_ip:${ip}`, 5, 900)
    if (rlIp.limited) {
      return NextResponse.json(
        { error: rlIp.unavailable ? 'الخدمة غير متوفرة مؤقتاً' : 'حاولت كثيراً. انتظر قليلاً ثم أعد المحاولة.' },
        { status: rlIp.unavailable ? 503 : 429 }
      )
    }

    const { email } = await req.json().catch(() => ({}))
    const clean = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!clean || !clean.includes('@')) {
      return NextResponse.json({ error: 'يرجى إدخال بريد إلكتروني صالح' }, { status: 400 })
    }

    // Per-email cap — prevents inbox flooding of a real address.
    const rlEmail = await isRateLimited(`resend_activation_email:${clean}`, 3, 900)
    if (rlEmail.limited && !rlEmail.unavailable) {
      // Still generic (don't confirm the address exists), just stop sending.
      return NextResponse.json(GENERIC)
    }

    const parent = await getParentByEmail(clean)
    // Only (re)send when there's genuinely something to activate. Already-verified
    // or non-existent addresses fall through to the same generic response.
    if (parent && parent.emailVerified !== true && parent.subscriptionStatus === 'pending') {
      try {
        const code = await createActivationCode(clean)
        await sendEmail({
          to: clean,
          subject: 'رمز تفعيل حسابك — أكاديمية أمين 🔑',
          html: welcomeParentEmail(parent.firstName, code),
        })
      } catch (mailErr) {
        console.warn('[resend-activation] email failed:', (mailErr as Error).message)
      }
    }

    return NextResponse.json(GENERIC)
  } catch (e) {
    console.error('[resend-activation]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
