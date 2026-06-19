import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { sendEmail } from '@/lib/mailer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !await verifyAdminSession(token)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const to = String(body.to || process.env.GMAIL_USER || '').trim()

    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'أدخل بريداً صالحاً' }, { status: 400 })
    }

    // Env var check
    const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
    const hasResend = !!process.env.RESEND_API_KEY
    if (!hasGmail && !hasResend) {
      return NextResponse.json({
        ok: false,
        error: 'لا يوجد مزوّد بريد مُعدّ. أضف GMAIL_USER و GMAIL_APP_PASSWORD في متغيرات Vercel.',
        gmailConfigured: false,
        resendConfigured: false,
      }, { status: 503 })
    }

    await sendEmail({
      to,
      subject: '✅ اختبار البريد — أكاديمية أمين',
      html: `<div dir="rtl" style="font-family:sans-serif;padding:24px">
        <h2 style="color:#5b6ef2">اختبار ناجح!</h2>
        <p>تم إرسال هذا البريد بنجاح من خادم أكاديمية أمين الدولية.</p>
        <p style="color:#64748b;font-size:13px">التاريخ: ${new Date().toLocaleString('fr-FR')}</p>
      </div>`,
    })

    return NextResponse.json({ ok: true, to, gmailConfigured: hasGmail, resendConfigured: hasResend })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !await verifyAdminSession(token)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  return NextResponse.json({
    gmailConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    gmailUser: process.env.GMAIL_USER ? process.env.GMAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : null,
    resendConfigured: !!process.env.RESEND_API_KEY,
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    upstashConfigured: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || null,
  })
}
