import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser, revokeStaffSession } from '@/lib/auth'
import { getStaff, updateStaff, deleteStaff } from '@/lib/db'
import { hashPassword } from '@/lib/password'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwnerUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const { id } = await params
    const staff = await getStaff(id)
    if (!staff) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
    }
    const body = await req.json().catch(() => ({}))
    const { name, password, isActive } = body as { name?: string; password?: string; isActive?: boolean }

    const updates: Partial<typeof staff> = {}
    if (typeof name === 'string' && name.trim()) updates.name = name.trim()
    if (typeof isActive === 'boolean') updates.isActive = isActive
    if (typeof password === 'string' && password) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'كلمة المرور قصيرة جداً (8 أحرف على الأقل)' }, { status: 400 })
      }
      updates.passwordHash = hashPassword(password)
    }

    await updateStaff(id, updates)
    // Force re-login immediately if the account was just deactivated
    if (isActive === false) await revokeStaffSession(id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/staff PATCH]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwnerUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const { id } = await params
    await revokeStaffSession(id)
    await deleteStaff(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/staff DELETE]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
