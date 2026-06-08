import { NextRequest, NextResponse } from 'next/server'
import { getParentByEmail } from '@/lib/db'
import { createPasswordResetToken } from '@/lib/db'
import { sendEmail } from '@/lib/mailer'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (await isRateLimited(`pwd_reset_req:${ip}`, 5, 3600)) {
    return NextResponse.json({ ok: true }) // silent — don't reveal rate limit
  }

  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'أدخل بريداً إلكترونياً صالحاً' }, { status: 400 })
    }

    // Always return ok=true to not reveal if email exists
    const parent = await getParentByEmail(email)
    if (!parent) {
      return NextResponse.json({ ok: true })
    }

    const token = await createPasswordResetToken(email)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amine-academy.vercel.app'
    const resetUrl = `${baseUrl}/parent/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    await sendEmail({
      to: email,
      subject: 'إعادة تعيين كلمة المرور — أكاديمية أمين',
      html: `<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="utf-8">
<style>* { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; } body { margin: 0; padding: 20px; background: #f0f4ff; direction: rtl; }</style>
</head>
<body>
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
    <div style="background:#5b6ef2;padding:32px 24px;text-align:center">
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800">🔐 أكاديمية أمين الدولية</h1>
    </div>
    <div style="padding:32px 24px">
      <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px">إعادة تعيين كلمة المرور</h2>
      <p style="color:#475569;line-height:1.8;margin:0 0 24px">مرحباً ${parent.firstName}، تلقّينا طلباً لإعادة تعيين كلمة مرور حسابك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetUrl}" style="display:inline-block;background:#5b6ef2;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px">إعادة تعيين كلمة المرور</a>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:24px 0 0">الرابط صالح لمدة <strong>ساعة واحدة</strong> فقط. إذا لم تطلب هذا، تجاهل هذه الرسالة.</p>
    </div>
    <div style="background:#f0f4ff;padding:16px 24px;text-align:center">
      <p style="color:#6b7280;font-size:12px;margin:0">Amine Academy — أكاديمية أمين الدولية</p>
    </div>
  </div>
</body></html>`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ ok: true }) // silent on error — no info leak
  }
}
