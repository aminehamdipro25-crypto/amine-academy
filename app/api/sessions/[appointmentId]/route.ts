import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { updateAppointment } from '@/lib/db'
import type { SessionLog } from '@/lib/types'

export const runtime = 'nodejs'

function clamp(n: number): 1 | 2 | 3 | 4 | 5 {
  const v = Math.min(5, Math.max(1, Math.round(n)))
  return v as 1 | 2 | 3 | 4 | 5
}

async function requireAdmin(): Promise<boolean> {
  return isDashboardUser()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ log: null }, { status: 401 })
  }
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
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const id = `SL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    const studentId = String(body.studentId || '').replace(/[^a-zA-Z0-9-_]/g, '')
    const log: SessionLog = {
      id,
      appointmentId: params.appointmentId,
      studentId,
      therapistNotes: String(body.therapistNotes || '').slice(0, 5000),
      observations: {
        attention:   clamp(Number(body.observations?.attention)   || 3),
        cooperation: clamp(Number(body.observations?.cooperation) || 3),
        energy:      clamp(Number(body.observations?.energy)      || 3),
        mood:        clamp(Number(body.observations?.mood)        || 3),
        anxiety:     clamp(Number(body.observations?.anxiety)     || 3),
      },
      exercises: Array.isArray(body.exercises) ? body.exercises : [],
      durationSeconds: Number(body.durationSeconds) || 0,
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      createdAt: new Date().toISOString(),
    }
    await redis.set(`session-log:${params.appointmentId}`, log, { ex: 365 * 24 * 3600 })
    if (studentId) {
      await redis.pipeline([['LPUSH', `sessions:student:${studentId}`, params.appointmentId]])
    }
    try {
      await updateAppointment(params.appointmentId, { status: 'completed' })
    } catch (e) {
      console.error('[session-log POST] failed to mark appointment completed', e)
    }
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[session-log POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const existing = await redis.get<SessionLog>(`session-log:${params.appointmentId}`)
    if (!existing) {
      return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 })
    }
    // Whitelist updatable fields to prevent overwriting critical data
    const updated: SessionLog = {
      ...existing,
      therapistNotes: body.therapistNotes !== undefined
        ? String(body.therapistNotes).slice(0, 5000)
        : existing.therapistNotes,
      observations: body.observations
        ? {
            attention:   clamp(Number(body.observations.attention)   || existing.observations.attention),
            cooperation: clamp(Number(body.observations.cooperation) || existing.observations.cooperation),
            energy:      clamp(Number(body.observations.energy)      || existing.observations.energy),
            mood:        clamp(Number(body.observations.mood)        || existing.observations.mood),
            anxiety:     clamp(Number(body.observations.anxiety)     || existing.observations.anxiety),
          }
        : existing.observations,
      highlights: Array.isArray(body.highlights) ? body.highlights : existing.highlights,
      durationSeconds: body.durationSeconds !== undefined
        ? Number(body.durationSeconds)
        : existing.durationSeconds,
    }
    await redis.set(`session-log:${params.appointmentId}`, updated, { ex: 365 * 24 * 3600 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[session-log PATCH]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
