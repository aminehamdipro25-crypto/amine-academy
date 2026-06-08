import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { generateId } from '@/lib/auth'
import type { SessionLog } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const log = await redis.get<SessionLog>(`session-log:${params.appointmentId}`)
    return NextResponse.json({ log })
  } catch {
    return NextResponse.json({ log: null })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const body = await req.json()
    const id = generateId('AP')
    const log: SessionLog = {
      id,
      appointmentId: params.appointmentId,
      studentId: body.studentId || '',
      therapistNotes: body.therapistNotes || '',
      observations: body.observations || {
        attention: 3, cooperation: 3, energy: 3, mood: 3, anxiety: 3,
      },
      exercises: body.exercises || [],
      durationSeconds: body.durationSeconds || 0,
      highlights: body.highlights || [],
      createdAt: new Date().toISOString(),
    }
    await redis.set(`session-log:${params.appointmentId}`, log, { ex: 365 * 24 * 3600 })
    // Also push to student's session history
    await redis.pipeline([
      ['LPUSH', `sessions:student:${log.studentId}`, params.appointmentId],
    ])
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const body = await req.json()
    const existing = await redis.get<SessionLog>(`session-log:${params.appointmentId}`)
    const updated = { ...(existing || {}), ...body, appointmentId: params.appointmentId }
    await redis.set(`session-log:${params.appointmentId}`, updated, { ex: 365 * 24 * 3600 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
