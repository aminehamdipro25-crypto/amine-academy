import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getParent, getStudentsByParent, getParentAppointments } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const token = cookies().get('parent_token')?.value
  const payload = await verifyToken(token)

  if (!payload || payload.role !== 'parent') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [parent, children, appointments] = await Promise.all([
    getParent(payload.id),
    getStudentsByParent(payload.id),
    getParentAppointments(payload.id),
  ])

  if (!parent) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const upcoming = appointments
    .filter(a => a.status === 'scheduled' && new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  return NextResponse.json({
    parent: { ...parent, passwordHash: undefined },
    children,
    upcomingAppointment: upcoming ? { date: upcoming.date, time: upcoming.timeSlot } : null,
    unreadReports: 0,
  })
}
