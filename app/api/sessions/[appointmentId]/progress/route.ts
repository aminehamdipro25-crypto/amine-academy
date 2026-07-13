import { NextRequest, NextResponse } from 'next/server'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:progress:${id}` }

// Live per-answer progress the child's exercise emits WHILE playing (distinct
// from kid-status, which is only active/done + final score). Lets the
// specialist watch the child answer in real time: current item, correct/
// wrong counts, and whether the last answer was right.
interface ProgressState {
  exerciseId: string
  answered: number
  total: number
  correct: number
  errors: number
  lastCorrect: boolean | null
  ts: number
}

const clampInt = (n: unknown, max = 9999) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n))) : 0

// GET — specialist polls this (and re-fetches on a 'progress' wake-up).
export async function GET(_req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await authorizeSession(params.appointmentId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const data = await redis.get<ProgressState>(key(params.appointmentId))
    return NextResponse.json({ progress: data ?? null })
  } catch {
    return NextResponse.json({ progress: null })
  }
}

// POST — kid page reports live progress. Authorized callers only (owning
// parent / staff). Rate limit is generous (progress can fire per answer) but
// still bounded so a runaway loop can't hammer Redis; the client also
// throttles. Empty/invalid bodies are rejected.
export async function POST(req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await authorizeSession(params.appointmentId))) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    const rl = await isRateLimited(`session_progress_post:${params.appointmentId}`, 240, 60)
    if (rl.limited) return NextResponse.json({ ok: false }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (!body?.exerciseId) return NextResponse.json({ ok: false }, { status: 400 })

    const state: ProgressState = {
      exerciseId: String(body.exerciseId).slice(0, 64),
      answered: clampInt(body.answered),
      total: clampInt(body.total),
      correct: clampInt(body.correct),
      errors: clampInt(body.errors),
      lastCorrect: typeof body.lastCorrect === 'boolean' ? body.lastCorrect : null,
      ts: Date.now(),
    }
    // Short TTL — progress is only meaningful live; it should not linger for
    // the next session. kid-status (with the final score) is the durable
    // record. 90 min so the specialist's live panel never blanks mid-session,
    // even across a long unscored relaxation/discussion block.
    await redis.set(key(params.appointmentId), state, { ex: 5400 })
    await publishSessionEvent(params.appointmentId, 'progress')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

// DELETE — clear progress (e.g. when an exercise ends or is cleared) so the
// specialist's live panel doesn't show a stale bar between exercises.
export async function DELETE(_req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await authorizeSession(params.appointmentId))) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    await redis.del(key(params.appointmentId))
    await publishSessionEvent(params.appointmentId, 'progress')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
