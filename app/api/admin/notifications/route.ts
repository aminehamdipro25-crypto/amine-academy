import { NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

const KEY = 'admin:new_appointment_notifications'

export interface AppointmentNotification {
  id: string
  parentName: string
  date: string
  timeSlot: string
  type: string
  createdAt: string
}

export async function GET() {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const raw = await redis.lrange(KEY, 0, -1)
    const items: AppointmentNotification[] = raw.flatMap(s => {
      try { return [JSON.parse(s) as AppointmentNotification] } catch { return [] }
    })
    return NextResponse.json({ count: items.length, items })
  } catch {
    return NextResponse.json({ count: 0, items: [] })
  }
}

export async function DELETE() {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    await redis.del(KEY)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
