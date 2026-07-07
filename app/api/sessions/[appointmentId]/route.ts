import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { updateAppointment } from '@/lib/db'
import type { SessionLog, SessionIncidentEntry } from '@/lib/types'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'

function clamp(n: number): 1 | 2 | 3 | 4 | 5 {
  const v = Math.min(5, Math.max(1, Math.round(n)))
  return v as 1 | 2 | 3 | 4 | 5
}

function sanitizeExercises(input: unknown): SessionLog['exercises'] {
  if (!Array.isArray(input)) return []
  return input.slice(0, 200).map(e => ({
    exerciseType:    String(e?.exerciseType    ?? '').slice(0, 60),
    exerciseLabelAr: String(e?.exerciseLabelAr ?? '').slice(0, 120),
    score:           Math.min(100, Math.max(0, Number(e?.score)    || 0)),
    accuracy:        Math.min(100, Math.max(0, Number(e?.accuracy) || 0)),
    errors:          Math.min(999, Math.max(0, Number(e?.errors)   || 0)),
    duration:        Math.min(3600, Math.max(0, Number(e?.duration) || 0)),
    metadata:        (e?.metadata && typeof e.metadata === 'object' && !Array.isArray(e.metadata))
                       ? e.metadata as Record<string, unknown>
                       : {},
    completedAt:     String(e?.completedAt ?? '').slice(0, 30),
  }))
}

function sanitizeHighlights(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, 100).map(h => String(h ?? '').slice(0, 300))
}

function sanitizeObservationLog(input: unknown): SessionLog['observationLog'] {
  if (!Array.isArray(input)) return []
  return input.slice(0, 500).map(e => ({
    text:     String(e?.text ?? '').slice(0, 300),
    category: String(e?.category ?? '').slice(0, 60),
    color:    String(e?.color ?? '').slice(0, 20),
    elapsed:  Number(e?.elapsed) || 0,
    ts:       String(e?.ts ?? '').slice(0, 20),
  }))
}

function sanitizeAbcLog(input: unknown): SessionLog['abcLog'] {
  if (!Array.isArray(input)) return []
  return input.slice(0, 500).map(e => ({
    antecedent:  String(e?.antecedent ?? '').slice(0, 500),
    behavior:    String(e?.behavior ?? '').slice(0, 500),
    consequence: String(e?.consequence ?? '').slice(0, 500),
    intensity:   ([1, 2, 3].includes(Number(e?.intensity)) ? Number(e?.intensity) : 1) as 1 | 2 | 3,
    ts:          String(e?.ts ?? '').slice(0, 20),
    elapsed:     Number(e?.elapsed) || 0,
  }))
}

function sanitizeIncidentLog(input: unknown): SessionLog['incidentLog'] {
  if (!Array.isArray(input)) return []
  const VALID_TYPES = ['meltdown','panic','self-harm','aggression','elopement','injury','other']
  return input.slice(0, 100).map(e => ({
    id:       String(e?.id       ?? '').slice(0, 60),
    type:     VALID_TYPES.includes(String(e?.type ?? '')) ? String(e.type) : 'other',
    severity: ([1,2,3].includes(Number(e?.severity)) ? Number(e.severity) : 1) as 1|2|3,
    notes:    String(e?.notes    ?? '').slice(0, 500),
    ts:       String(e?.ts       ?? '').slice(0, 20),
    elapsed:  String(e?.elapsed  ?? '').slice(0, 20),
    loggedAt: String(e?.loggedAt ?? '').slice(0, 30) || new Date().toISOString(),
  }))
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
      exercises: sanitizeExercises(body.exercises),
      durationSeconds: Math.min(7200, Math.max(0, Number(body.durationSeconds) || 0)),
      highlights: sanitizeHighlights(body.highlights),
      observationLog: sanitizeObservationLog(body.observationLog),
      abcLog: sanitizeAbcLog(body.abcLog),
      incidentLog: sanitizeIncidentLog(body.incidentLog),
      createdAt: new Date().toISOString(),
    }
    await redis.set(`session-log:${params.appointmentId}`, log, { ex: 365 * 24 * 3600 })
    if (studentId) {
      await redis.pipeline([['LPUSH', `sessions:student:${studentId}`, params.appointmentId]])
    }
    // Only the explicit "حفظ" action finalizes the appointment as completed.
    // The 30s silent backup (finalize: false/omitted) must NOT flip status —
    // otherwise an in-progress or abandoned session shows as completed.
    if (body.finalize) {
      try {
        await updateAppointment(params.appointmentId, { status: 'completed' })
      } catch (e) {
        console.error('[session-log POST] failed to mark appointment completed', e)
      }
    }
    await audit({ action: 'session_save', actorId: 'admin', actorRole: 'admin', targetId: studentId, meta: { appointmentId: params.appointmentId } })
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
      highlights: Array.isArray(body.highlights) ? sanitizeHighlights(body.highlights) : existing.highlights,
      durationSeconds: body.durationSeconds !== undefined
        ? Number(body.durationSeconds)
        : existing.durationSeconds,
      observationLog: body.observationLog !== undefined
        ? sanitizeObservationLog(body.observationLog)
        : (existing.observationLog ?? []),
      abcLog: body.abcLog !== undefined
        ? sanitizeAbcLog(body.abcLog)
        : (existing.abcLog ?? []),
      incidentLog: body.incidentLog !== undefined
        ? sanitizeIncidentLog(body.incidentLog)
        : (existing.incidentLog ?? []),
    }
    await redis.set(`session-log:${params.appointmentId}`, updated, { ex: 365 * 24 * 3600 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[session-log PATCH]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
