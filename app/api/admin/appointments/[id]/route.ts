import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getAppointment, updateAppointment } from '@/lib/db'

export const runtime = 'nodejs'

const VALID_STATUSES = ['scheduled', 'completed', 'cancelled', 'no-show'] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { id } = await params
    const appt = await getAppointment(id)
    if (!appt) return NextResponse.json({ error: 'الموعد غير موجود' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const updates: Partial<typeof appt> = {}

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
      }
      updates.status = body.status
    }
    if (typeof body.notes === 'string') updates.notes = body.notes.slice(0, 1000)
    if (typeof body.meetingUrl === 'string') updates.meetingUrl = body.meetingUrl

    await updateAppointment(id, updates)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/appointments/patch]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
