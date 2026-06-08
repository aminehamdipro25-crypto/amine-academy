export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getAllPendingPayments, getPendingPayment, updatePendingPayment, updateParent } from '@/lib/db'

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return verifyAdminSession(token)
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const payments = await getAllPendingPayments()
    return NextResponse.json({ payments })
  } catch (e) {
    console.error('[admin/payments GET]', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'معرّف الدفع مطلوب' }, { status: 400 })
    }

    const body = await req.json()
    const { status, adminNotes } = body

    if (!['confirmed', 'rejected', 'pending', 'expired'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const payment = await getPendingPayment(id)
    if (!payment) {
      return NextResponse.json({ error: 'الدفع غير موجود' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { status }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes
    if (status === 'confirmed') updates.confirmedAt = new Date().toISOString()

    await updatePendingPayment(id, updates)

    // If confirming and payment has a parentId, activate the parent's subscription
    if (status === 'confirmed' && payment.parentId) {
      try {
        await updateParent(payment.parentId, {
          subscriptionStatus: 'active',
          subscriptionPlan: payment.plan,
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        })
      } catch (e) {
        console.warn('[admin/payments PATCH] failed to update parent subscription:', (e as Error).message)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/payments PATCH]', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
