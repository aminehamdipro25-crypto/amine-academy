import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getAllStaff, getStaffByEmail, createStaff } from '@/lib/db'
import { hashPassword } from '@/lib/password'

export const runtime = 'nodejs'

export async function GET() {
  // Staff accounts (therapists) — creation/management is the owner's
  // privilege only, never delegated to another staff member.
  if (!(await isOwnerUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const staff = await getAllStaff()
    return NextResponse.json(staff.map(({ passwordHash, ...s }) => s))
  } catch (e) {
    console.error('[admin/staff GET]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isOwnerUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const { name, email, password } = body as { name?: string; email?: string; password?: string }
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور قصيرة جداً (8 أحرف على الأقل)' }, { status: 400 })
    }
    if (await getStaffByEmail(email)) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
    }

    const staff = await createStaff({
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      isActive: true,
    })
    const { passwordHash, ...safe } = staff
    return NextResponse.json(safe, { status: 201 })
  } catch (e) {
    console.error('[admin/staff POST]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
