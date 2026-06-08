import { NextRequest, NextResponse } from 'next/server'
import { getParentByEmail, updateParent, verifyPasswordResetToken, deletePasswordResetToken } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (await isRateLimited(`pwd_reset_use:${ip}`, 10, 3600)) {
    return NextResponse.json({ error: 'حاول مجدداً بعد قليل' }, { status: 429 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { token, email, password } = body as {
      token?: string
      email?: string
      password?: string
    }

    if (!token || !email || !password) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
    }

    const sanitizedEmail = String(email).trim().toLowerCase()
    const valid = await verifyPasswordResetToken(sanitizedEmail, String(token).trim())

    if (!valid) {
      return NextResponse.json({ error: 'الرابط غير صالح أو انتهت صلاحيته' }, { status: 400 })
    }

    const parent = await getParentByEmail(sanitizedEmail)
    if (!parent) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 })
    }

    const passwordHash = hashPassword(password)
    await updateParent(parent.id, { passwordHash })
    await deletePasswordResetToken(sanitizedEmail)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
