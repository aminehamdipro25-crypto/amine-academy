import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { sendEmail } from '@/lib/mailer'
import { audit } from '@/lib/audit'
import { redis } from '@/lib/redis'
import { RECOVERY_TTL_SECONDS, recoveryKey, recoveryRecipient, recoveryBaseUrl } from '@/lib/admin-recovery'

export const runtime = 'nodejs'

/**
 * Owner access recovery.
 *
 * The owner password is the ADMIN_PASSWORD env var, not a stored account, so it
 * cannot be "reset" from the app. Instead we email a single-use login link to
 * the address configured in server env, which mints a normal admin session.
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)

    // Tight limit: this sends mail to a fixed address, so it's an inbox-flood
    // vector if left open.
    const rl = await isRateLimited(`admin_recover:${ip}`, 3, 3600)
    if (rl.limited) {
      return rl.unavailable
        ? NextResponse.json({ error: 'الخدمة غير متوفرة مؤقتًا (تعذّر الاتصال بقاعدة البيانات)' }, { status: 503 })
        : NextResponse.json({ error: 'طلبات كثيرة — انتظر ساعة قبل طلب رابط جديد' }, { status: 429 })
    }

    const to = recoveryRecipient()
    if (!to) {
      return NextResponse.json(
        { error: 'لا يوجد بريد استرجاع مضبوط — أضف NOTIFY_EMAIL أو ADMIN_EMAIL في Vercel ثم أعد النشر' },
        { status: 503 },
      )
    }

    const token = crypto.randomBytes(32).toString('hex')
    await redis.set(recoveryKey(token), '1', { ex: RECOVERY_TTL_SECONDS })

    const link = `${recoveryBaseUrl(req)}/dashboard/login/recover?token=${token}`
    await sendEmail({
      to,
      subject: 'رابط استعادة الدخول — لوحة تحكم أكاديمية أمين',
      html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9;color:#111827">
        <h2 style="color:#6B46F0;margin:0 0 12px">استعادة الدخول للوحة التحكم</h2>
        <p>طُلب رابط دخول لمرة واحدة للوحة تحكم المشرف.</p>
        <p style="margin:22px 0">
          <a href="${link}" style="background:#6B46F0;color:#fff;padding:12px 26px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">
            تسجيل الدخول الآن
          </a>
        </p>
        <p style="color:#6B7280;font-size:13px">هذا الرابط صالح <strong>15 دقيقة</strong> ويُستخدم <strong>مرة واحدة فقط</strong>.</p>
        <p style="color:#B91C1C;font-size:13px">إن لم تطلب هذا الرابط فتجاهل الرسالة — لم يتغيّر شيء في حسابك.</p>
      </div>`,
      text: `رابط دخول لمرة واحدة (صالح 15 دقيقة): ${link}`,
    })

    await audit({ action: 'login', actorId: 'admin', actorRole: 'admin', ip })

    // Generic response: never reveal the recipient address.
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin-recover]', err)
    return NextResponse.json({ error: 'تعذّر إرسال رابط الاستعادة — تحقّق من إعدادات البريد' }, { status: 500 })
  }
}
