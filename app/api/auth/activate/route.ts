import { NextRequest, NextResponse } from 'next/server'
import { verifyActivationCode, deleteActivationCode, getParentByEmail, updateParent } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
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

    if (parent.subscriptionStatus === 'pending') {
      await updateParent(parent.id, { subscriptionStatus: 'active' })
    }

    await deleteActivationCode(email)

    return NextResponse.json({ ok: true, message: 'تم تفعيل حسابك بنجاح!' })
  } catch (e) {
    console.error('[activate]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
