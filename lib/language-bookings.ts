import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis'
import type { LessonBooking } from '@/lib/types'

// ── Amine Languages — lesson bookings ────────────────────────────────────────
// Redis keys: booking:<id> → JSON ; bookings:index → [id]

const KEY = (id: string) => `booking:${id}`
const INDEX = 'bookings:index'

export type NewBooking = Omit<LessonBooking, 'id' | 'createdAt' | 'status' | 'sessionId'>

export async function createBooking(data: NewBooking): Promise<LessonBooking> {
  const booking: LessonBooking = { ...data, id: `bk_${randomUUID()}`, status: 'requested', createdAt: new Date().toISOString() }
  await redis.set(KEY(booking.id), booking)
  await redis.lpush(INDEX, booking.id)
  return booking
}

export async function getBooking(id: string): Promise<LessonBooking | null> {
  return redis.get<LessonBooking>(KEY(id))
}

export async function getAllBookings(): Promise<LessonBooking[]> {
  const ids = await redis.lrange(INDEX, 0, -1)
  if (!ids.length) return []
  const rows = await redis.mget<LessonBooking>(ids.map(KEY))
  return (rows.filter(Boolean) as LessonBooking[]).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function updateBooking(id: string, updates: Partial<LessonBooking>): Promise<void> {
  const current = await getBooking(id)
  if (!current) return
  await redis.set(KEY(id), { ...current, ...updates })
}
