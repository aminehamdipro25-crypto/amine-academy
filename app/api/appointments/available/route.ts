import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getAppointmentsByDate } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Specialist working slots (Sun–Thu). 15-minute granularity so families can
// pick e.g. 17:30 or 17:45, not just whole hours. 13:xx is the lunch break.
const WORK_HOURS = [9, 10, 11, 12, 14, 15, 16, 17, 18]
const MINUTES    = [0, 15, 30, 45]
const ALL_SLOTS  = WORK_HOURS.flatMap(h =>
  MINUTES.map(m => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
)

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date requis (YYYY-MM-DD)' }, { status: 400 })
    }

    // Reject Fridays and Saturdays (day 5 = Fri, 6 = Sat in JS)
    const dayOfWeek = new Date(date).getUTCDay()
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return NextResponse.json({ slots: ALL_SLOTS.map(t => ({ time: t, available: false })) })
    }

    const booked = await getAppointmentsByDate(date)
    const bookedTimes = new Set(booked.map(a => a.timeSlot))

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const nowMins = now.getHours() * 60 + now.getMinutes()

    const slots = ALL_SLOTS.map(time => {
      const [h, m] = time.split(':').map(Number)
      const isPast = date === today && (h * 60 + m) <= nowMins
      return { time, available: !bookedTimes.has(time) && !isPast }
    })

    return NextResponse.json({ slots })
  } catch (err) {
    console.error('[appointments-available]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
