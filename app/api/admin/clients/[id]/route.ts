import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser, isOwnerUser, revokeSession } from '@/lib/auth'
import { getParent, updateParent, getStudentsByParent, getParentAppointments, deleteParentFull } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import type { SubscriptionStatus } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const { id } = await params
    const parent = await getParent(id)
    if (!parent) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

    const [students, appointments] = await Promise.all([
      getStudentsByParent(id),
      getParentAppointments(id),
    ])

    const safeParent = { ...parent, passwordHash: undefined }
    return NextResponse.json({ parent: safeParent, students, appointments })
  } catch (e) {
    console.error('[admin/clients/get]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

const VALID_STATUSES: SubscriptionStatus[] = ['pending', 'active', 'suspended', 'cancelled', 'expired']
const VALID_PLANS = ['basic', 'standard', 'premium', 'session', 'weekly', 'monthly'] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { id } = await params
    const parent = await getParent(id)
    if (!parent) return NextResponse.json({ error: 'المشترك غير موجود' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const updates: Parameters<typeof updateParent>[1] = {}

    if (body.subscriptionStatus !== undefined) {
      if (!VALID_STATUSES.includes(body.subscriptionStatus)) {
        return NextResponse.json({ error: 'حالة اشتراك غير صالحة' }, { status: 400 })
      }
      updates.subscriptionStatus = body.subscriptionStatus
    }
    if (body.subscriptionPlan !== undefined) {
      if (!VALID_PLANS.includes(body.subscriptionPlan)) {
        return NextResponse.json({ error: 'خطة اشتراك غير صالحة' }, { status: 400 })
      }
      updates.subscriptionPlan = body.subscriptionPlan
    }
    if (body.subscriptionExpiry !== undefined) {
      updates.subscriptionExpiry = body.subscriptionExpiry || null
    }
    if (typeof body.notes === 'string') {
      updates.notes = body.notes.slice(0, 2000)
    }
    if (typeof body.newPassword === 'string') {
      if (body.newPassword.length < 8) {
        return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
      }
      updates.passwordHash = hashPassword(body.newPassword)
    }

    await updateParent(id, updates)

    // Kill any existing session immediately on suspension or a forced
    // password reset — otherwise the restriction/new-password only takes
    // effect at the parent's NEXT login; their currently-open session (or a
    // stolen token) would keep working with full access regardless.
    if (updates.subscriptionStatus === 'suspended' || updates.passwordHash) {
      await revokeSession(id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/clients/patch]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Permanently deleting a client's account is an owner-level action —
    // staff accounts can view/manage clients but not erase them.
    if (!await isOwnerUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const { id } = await params
    const parent = await getParent(id)
    if (!parent) return NextResponse.json({ error: 'المشترك غير موجود' }, { status: 404 })
    await deleteParentFull(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/clients/delete]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
