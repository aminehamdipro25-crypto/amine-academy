import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { createAppointment, getParentAppointments } from '@/lib/db'
import { sendEmail, appointmentConfirmEmail } from '@/lib/mailer'
import { getParent } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const token = cookies().get('parent_token')?.value
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'parent') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const appointments = await getParentAppointments(payload.id)
  return NextResponse.json({ appointments })
}

export async function POST(req: Request) {
  const token = cookies().get('parent_token')?.value
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'parent') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { studentId, date, timeSlot, type, notes } = await req.json()

  if (!studentId || !date || !timeSlot || !type) {
    return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
  }

  // Optimistic write before sending email
  const appointment = await createAppointment({
    parentId: payload.id,
    studentId,
    date,
    timeSlot,
    type,
    status: 'scheduled',
    notes: notes || '',
  })

  // Send confirmation email
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
}
