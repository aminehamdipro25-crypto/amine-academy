import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis'
import type { TeachingSession } from '@/lib/types'

// ── Amine Languages — teaching-session ledger (Phase 3) ──────────────────────
// Redis keys:
//   teaching_session:<id>        → TeachingSession JSON
//   teaching_sessions:index      → [id]   (LPUSH / LRANGE)

const KEY = (id: string) => `teaching_session:${id}`
const INDEX = 'teaching_sessions:index'

export interface NewTeachingSession {
  teacherId: string
  teacherName: string
  learnerName: string
  learnerId?: string
  language: string
  dateISO: string
  durationHours: number
  price: number
  currency: 'QAR' | 'TND'
  teacherSharePct: number
  status: TeachingSession['status']
  note?: string
  createdBy: string
}

// Split a session's price into the teacher's cut and the academy's cut.
export function computeSplit(price: number, sharePct: number) {
  const p = Math.max(0, Math.round(price))
  const pct = Math.min(100, Math.max(0, sharePct))
  const teacherEarn = Math.round((p * pct) / 100)
  return { teacherEarn, academyEarn: p - teacherEarn }
}

export async function createTeachingSession(data: NewTeachingSession): Promise<TeachingSession> {
  const { teacherEarn, academyEarn } = computeSplit(data.price, data.teacherSharePct)
  const session: TeachingSession = {
    id: `ts_${randomUUID()}`,
    ...data,
    price: Math.max(0, Math.round(data.price)),
    durationHours: Math.max(0, data.durationHours),
    teacherEarn,
    academyEarn,
    createdAt: new Date().toISOString(),
  }
  await redis.set(KEY(session.id), session)
  await redis.lpush(INDEX, session.id)
  return session
}

export async function getTeachingSession(id: string): Promise<TeachingSession | null> {
  return redis.get<TeachingSession>(KEY(id))
}

export async function getAllTeachingSessions(): Promise<TeachingSession[]> {
  const ids = await redis.lrange(INDEX, 0, -1)
  if (!ids.length) return []
  const rows = await redis.mget<TeachingSession>(ids.map(KEY))
  return (rows.filter(Boolean) as TeachingSession[])
    .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)) // newest first
}

export async function updateTeachingSession(id: string, updates: Partial<TeachingSession>): Promise<void> {
  const current = await getTeachingSession(id)
  if (!current) return
  const merged = { ...current, ...updates }
  // Re-derive the split if price or share changed.
  if (updates.price !== undefined || updates.teacherSharePct !== undefined) {
    const { teacherEarn, academyEarn } = computeSplit(merged.price, merged.teacherSharePct)
    merged.teacherEarn = teacherEarn
    merged.academyEarn = academyEarn
  }
  await redis.set(KEY(id), merged)
}

export async function deleteTeachingSession(id: string): Promise<void> {
  // DEL the record and remove it from the index list in one round-trip,
  // exactly like deleteStaff in lib/db.ts.
  await redis.pipeline([
    ['DEL', KEY(id)],
    ['LREM', INDEX, '0', id],
  ])
}
