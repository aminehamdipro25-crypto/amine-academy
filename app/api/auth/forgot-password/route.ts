import { NextRequest, NextResponse } from 'next/server'
import { getParentByEmail, createPasswordResetToken } from '@/lib/db'
import { sendEmail, resetPasswordEmail } from '@/lib/mailer'

export const runtime = 'nodejs'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://amine-academy.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json().catch(() => ({}))
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: true }) // don't reveal
    }

    const normalizedEmail = email.trim().toLowerCase()
    const parent = await getParentByEmail(normalizedEmail)

    // Always return 200 — don't reveal whether the email exists (security best practice)
    if (!parent) {
      return NextResponse.json({ ok: true })
    }

    const token = await createPasswordResetToken(normalizedEmail)
    const resetUrl = `${BASE_URL}/parent/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`

    await sendEmail({
      to: normalizedEmail,
      subject: 'إعادة تعيين كلمة المرور — أكاديمية أمين',
      html: resetPasswordEmail(resetUrl),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[forgot-password]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
