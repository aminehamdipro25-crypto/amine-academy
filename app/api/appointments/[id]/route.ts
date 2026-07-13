import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isDashboardUser, verifyToken } from '@/lib/auth'
import { getAppointment, updateAppointment, getParentAppointments } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!(await isDashboardUser())) {
    return NextResponse.json({ appointment: null }, { status: 401 })
  }
  try {
    const appointment = await getAppointment(params.id)
    return NextResponse.json({ appointment })
  } catch {
    return NextResponse.json({ appointment: null })
  }
}

// Parent cancels their own upcoming appointment
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const appointment = await getAppointment(params.id)
    if (!appointment) {
      return NextResponse.json({ error: 'الموعد غير موجود' }, { status: 404 })
    }

    // Verify appointment belongs to this parent
    const parentAppts = await getParentAppointments(payload.id)
    if (!parentAppts.some(a => a.id === params.id)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    if (appointment.status !== 'scheduled') {
      return NextResponse.json({ error: 'لا يمكن إلغاء هذا الموعد' }, { status: 400 })
    }

    // Only allow cancelling if appointment is at least 2 hours away
    const apptTime = new Date(`${appointment.date}T${appointment.timeSlot.split('-')[0]}`)
    if (apptTime.getTime() - Date.now() < 2 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'لا يمكن الإلغاء قبل أقل من ساعتين من الموعد — تواصل مع الأخصائي مباشرة' }, { status: 400 })
    }

    await updateAppointment(params.id, { status: 'cancelled' })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[appointments PATCH]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
