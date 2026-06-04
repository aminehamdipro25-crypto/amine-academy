import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { createAppointment, getParentAppointments, getParent } from '@/lib/db'
import { sendEmail, appointmentConfirmEmail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const token = cookies().get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const appointments = await getParentAppointments(payload.id)
    return NextResponse.json({ appointments })
  } catch (err) {
    console.error('[appointments-get]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const token = cookies().get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { studentId, date, timeSlot, type, notes } = await req.json()

    if (!studentId || !date || !timeSlot || !type) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    const appointment = await createAppointment({
      parentId: payload.id,
      studentId,
      date,
      timeSlot,
      type,
      status: 'scheduled',
      notes: notes || '',
    })

    try {
      const parent = await getParent(payload.id)
      if (parent) {
        await sendEmail({
          to:      parent.email,
          subject: 'تأكيد الموعد — أكاديمية أمين',
          html:    appointmentConfirmEmail(`${parent.firstName} ${parent.lastName}`, date, timeSlot),
        })
      }
    } catch { /* email failure non-critical */ }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (err) {
    console.error('[appointments-post]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
