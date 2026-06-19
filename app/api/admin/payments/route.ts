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

// Plan duration in days — 'basic'/'standard'/'premium' are legacy aliases for 'session'/'weekly'/'monthly'
const PLAN_DURATION_DAYS: Record<string, number> = {
  session: 1, basic: 1,
  weekly: 7, standard: 7,
  monthly: 30, premium: 30,
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

    // Idempotency: already confirmed → skip reprocessing
    if (payment.status === 'confirmed' && status === 'confirmed') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const updates: Record<string, unknown> = { status }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes
    if (status === 'confirmed') updates.confirmedAt = new Date().toISOString()

    await updatePendingPayment(id, updates)

    // If confirming and payment has a parentId, activate the parent's subscription
    if (status === 'confirmed' && payment.parentId) {
      const durationDays = PLAN_DURATION_DAYS[payment.plan] ?? 30
      await updateParent(payment.parentId, {
        subscriptionStatus: 'active',
        subscriptionPlan: payment.plan,
        subscriptionExpiry: new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString(),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/payments PATCH]', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
