import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { createAppointment, updateAppointment } from '@/lib/db'
import { sendEmail, appointmentConfirmEmail } from '@/lib/mailer'
import { getParent } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!await verifyAdminSession(token)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body?.parentId || !body?.studentId || !body?.date || !body?.timeSlot || !body?.type) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    const appt = await createAppointment({
      parentId: body.parentId,
      studentId: body.studentId,
      date: body.date,
      timeSlot: body.timeSlot,
      type: body.type,
      status: 'scheduled',
      meetingUrl: '',
      notes: body.notes || '',
    })

    const roomName = `AmineAcademy${appt.id.replace(/[^a-zA-Z0-9]/g, '')}`
    const meetingUrl = `https://meet.jit.si/${roomName}`
    await updateAppointment(appt.id, { meetingUrl })

    try {
      const parent = await getParent(body.parentId)
      if (parent) {
        await sendEmail({
          to: parent.email,
          subject: 'تم جدولة موعدك — أكاديمية أمين',
          html: appointmentConfirmEmail(`${parent.firstName} ${parent.lastName}`, body.date, body.timeSlot),
        })
      }
    } catch { /* non-critical */ }

    return NextResponse.json({ ok: true, appointment: { ...appt, meetingUrl } }, { status: 201 })
  } catch (e) {
    console.error('[admin/appointments/post]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
