import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { isUsableName, sanitizePersonName } from '@/lib/person-name'
import { getParent, getStudentsByParent, getParentAppointments, getStudentReports, updateParent } from '@/lib/db'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const body = await req.json()
    const allowed: Record<string, string> = {}
    if (typeof body.phone === 'string') allowed.phone = body.phone.trim().slice(0, 30)
    // Same sanitising as registration: a rename is the same channel, and a
    // payload smuggled in here would reach the very next generated report.
    if (isUsableName(body.firstName)) allowed.firstName = sanitizePersonName(body.firstName)
    if (isUsableName(body.lastName)) allowed.lastName = sanitizePersonName(body.lastName)
    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'لا توجد حقول قابلة للتعديل' }, { status: 400 })
    }
    await updateParent(payload.id, allowed)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[parent-me PATCH]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
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

    // Count reports created in the last 7 days as "new/unread"
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const allReports = await Promise.all(children.map(c => getStudentReports(c.id)))
    const unreadReports = allReports.flat().filter(r => new Date(r.createdAt) >= sevenDaysAgo).length

    return NextResponse.json({
      parent: { ...parent, passwordHash: undefined },
      children,
      upcomingAppointment: upcoming ? { date: upcoming.date, time: upcoming.timeSlot } : null,
      unreadReports,
    })
  } catch (err) {
    console.error('[parent-me]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
