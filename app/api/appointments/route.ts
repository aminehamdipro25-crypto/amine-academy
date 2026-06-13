import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { createAppointment, updateAppointment, getParentAppointments, getParent, getStudentsByParent } from '@/lib/db'
import { sendEmail, appointmentConfirmEmail } from '@/lib/mailer'
import { tg, tgEsc } from '@/lib/telegram'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
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
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { studentId, date, timeSlot, type, notes } = await req.json()

    if (!studentId || !date || !timeSlot || !type) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    // IDOR guard: verify studentId belongs to the authenticated parent
    const parentStudents = await getStudentsByParent(payload.id)
    if (!parentStudents.some(s => s.id === studentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const appt = await createAppointment({
      parentId: payload.id,
      studentId,
      date,
      timeSlot,
      type,
      status: 'scheduled',
      meetingUrl: '',
      notes: notes || '',
    })
    const roomName = `AmineAcademy${appt.id.replace(/[^a-zA-Z0-9]/g, '')}`
    await updateAppointment(appt.id, { meetingUrl: `https://meet.jit.si/${roomName}` })
    const appointment = { ...appt, meetingUrl: `https://meet.jit.si/${roomName}` }

    try {
      const parent = await getParent(payload.id)
      if (parent) {
        await sendEmail({
          to:      parent.email,
          subject: 'تأكيد الموعد — أكاديمية أمين',
          html:    appointmentConfirmEmail(`${parent.firstName} ${parent.lastName}`, date, timeSlot),
        })
        tg(
          `📅 <b>موعد جديد!</b>\n\n` +
          `👤 ${tgEsc(parent.firstName)} ${tgEsc(parent.lastName)}\n` +
          `📧 ${tgEsc(parent.email)}\n` +
          `📌 النوع: ${tgEsc(type)}\n` +
          `📆 التاريخ: ${tgEsc(date)}\n` +
          `⏰ الوقت: ${tgEsc(timeSlot)}\n` +
          (notes?.trim() ? `📝 ملاحظات: ${tgEsc(notes)}\n` : '') +
          `🕐 ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Qatar' })}`
        ).catch(() => {})
      }
    } catch { /* email failure non-critical */ }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (err) {
    console.error('[appointments-post]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
