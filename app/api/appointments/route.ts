import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { createAppointment, updateAppointment, getParentAppointments, getParent, getStudentsByParent } from '@/lib/db'
import { sendEmail, appointmentConfirmEmail } from '@/lib/mailer'
import { tg, tgEsc } from '@/lib/telegram'
import { createDailyRoom, dailyRoomNameFor } from '@/lib/daily'
import { redis } from '@/lib/redis'

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

    // Validate the time is a real HH:MM inside working hours (09:00–18:45)
    const tm = /^(\d{2}):(\d{2})$/.exec(String(timeSlot))
    if (!tm) return NextResponse.json({ error: 'وقت غير صالح' }, { status: 400 })
    const th = Number(tm[1]), tmin = Number(tm[2])
    if (th < 9 || th > 18 || ![0, 15, 30, 45].includes(tmin)) {
      return NextResponse.json({ error: 'وقت غير صالح' }, { status: 400 })
    }

    // IDOR guard: verify studentId belongs to the authenticated parent
    const parentStudents = await getStudentsByParent(payload.id)
    if (!parentStudents.some(s => s.id === studentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    let appt
    try {
      appt = await createAppointment({
        parentId: payload.id,
        studentId,
        date,
        timeSlot,
        type,
        status: 'scheduled',
        meetingUrl: '',
        notes: notes || '',
      })
    } catch (bookingErr) {
      const err = bookingErr as { code?: string; message?: string }
      if (err.code === 'SLOT_TAKEN') {
        return NextResponse.json({ error: err.message || 'الوقت المحدد محجوز' }, { status: 409 })
      }
      throw bookingErr
    }

    const meetingUrl = await createDailyRoom(dailyRoomNameFor(appt.id))
    await updateAppointment(appt.id, { meetingUrl })
    const appointment = { ...appt, meetingUrl }

    try {
      const parent = await getParent(payload.id)
      if (parent) {
        const parentName = `${parent.firstName} ${parent.lastName}`
        await sendEmail({
          to:      parent.email,
          subject: 'تأكيد الموعد — أكاديمية أمين',
          html:    appointmentConfirmEmail(parentName, date, timeSlot),
        })
        tg(
          `📅 <b>موعد جديد!</b>\n\n` +
          `👤 ${tgEsc(parent.firstName)} ${tgEsc(parent.lastName)}\n` +
          `📧 ${tgEsc(parent.email)}\n` +
          `📌 النوع: ${tgEsc(type)}\n` +
          `📆 التاريخ: ${tgEsc(date)}\n` +
          `⏰ الوقت: ${tgEsc(timeSlot)}\n` +
          (notes?.trim() ? `📝 ملاحظات: ${tgEsc(notes)}\n` : '') +
          `🕐 ${new Date().toLocaleString('fr-FR', { timeZone: 'Asia/Qatar' })}`
        ).catch(() => {})
        // Push in-app notification for admin bell
        redis.lpush('admin:new_appointment_notifications', JSON.stringify({
          id: appt.id, parentName, date, timeSlot, type, createdAt: appt.createdAt,
        })).catch(() => {})
      }
    } catch { /* email failure non-critical */ }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (err) {
    console.error('[appointments-post]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
