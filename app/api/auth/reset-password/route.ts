import { NextRequest, NextResponse } from 'next/server'
import { getParentByEmail, verifyPasswordResetToken, deletePasswordResetToken, updateParent } from '@/lib/db'
import { hashPassword } from '@/lib/password'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json().catch(() => ({}))

    if (!email || !token || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const valid = await verifyPasswordResetToken(normalizedEmail, String(token).trim())
    if (!valid) {
      return NextResponse.json({ error: 'الرابط غير صالح أو منتهي الصلاحية' }, { status: 400 })
    }

    const parent = await getParentByEmail(normalizedEmail)
    if (!parent) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 400 })
    }

    const passwordHash = hashPassword(password)
    await updateParent(parent.id, { passwordHash })
    await deletePasswordResetToken(normalizedEmail)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[reset-password]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
