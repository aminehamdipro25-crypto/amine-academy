import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getAppointmentsByDate } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Specialist working slots (Sun–Thu, 09:00–18:00)
const ALL_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00']

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

    const today = new Date().toISOString().split('T')[0]
    const nowHour = new Date().getHours()

    const slots = ALL_SLOTS.map(time => {
      const [h] = time.split(':').map(Number)
      const isPast = date === today && h <= nowHour
      return { time, available: !bookedTimes.has(time) && !isPast }
    })

    return NextResponse.json({ slots })
  } catch (err) {
    console.error('[appointments-available]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
