import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent, getAppointment } from '@/lib/db'
import { redis } from '@/lib/redis'
import type { SessionLog } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Parent-safe summary of a live session: highlights, exercise results, behavior
// ratings, and the therapist's written notes — never the raw ABC incident log
// or moment-by-moment observation log, which are clinical detail for staff only.
interface ParentSessionSummary {
  appointmentId: string
  date: string
  timeSlot: string
  durationSeconds: number
  highlights: string[]
  exercises: { exerciseLabelAr: string; score: number; accuracy: number }[]
  observations: SessionLog['observations']
  therapistNotes: string
  createdAt: string
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const children = await getStudentsByParent(payload.id)
    const sessionsPerChild = await Promise.all(
      children.map(async child => {
        const rawIds = await redis.lrange(`sessions:student:${child.id}`, 0, 200)
        // Deduplicate — the list can accumulate duplicate IDs from repeated auto-saves
        const appointmentIds = [...new Set(rawIds)]
        const logs = (await Promise.all(
          appointmentIds.map(aid => redis.get<SessionLog>(`session-log:${aid}`))
        )).filter(Boolean) as SessionLog[]

        // Secondary dedup by appointmentId (in case two different keys point to same session)
        const seen = new Set<string>()
        const uniqueLogs = logs.filter(log => {
          if (seen.has(log.appointmentId)) return false
          seen.add(log.appointmentId)
          return true
        })

        const sessions: ParentSessionSummary[] = await Promise.all(
          uniqueLogs.map(async log => {
            const appt = await getAppointment(log.appointmentId)
            return {
              appointmentId: log.appointmentId,
              date: appt?.date ?? log.createdAt,
              timeSlot: appt?.timeSlot ?? '',
              durationSeconds: log.durationSeconds,
              highlights: log.highlights ?? [],
              exercises: (log.exercises ?? []).map(e => ({
                exerciseLabelAr: e.exerciseLabelAr,
                score: e.score,
                accuracy: e.accuracy,
              })),
              observations: log.observations,
              therapistNotes: log.therapistNotes,
              createdAt: log.createdAt,
            }
          })
        )

        sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return { child, sessions }
      })
    )

    return NextResponse.json({ sessionsPerChild })
  } catch (err) {
    console.error('[parent-sessions]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
