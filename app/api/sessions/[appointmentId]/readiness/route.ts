import { NextRequest, NextResponse } from 'next/server'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:readiness:${id}` }

// 1-5 scale answers to the 3 pre-session readiness questions (sleep/energy/
// mood), 0 = unanswered. `active` gates whether the kid page shows the
// interactive question screen at all — the specialist turns it on when
// reaching the pre-session screen and off the moment they start/skip, so the
// child's screen switches back to the normal waiting/exercise flow exactly
// when the specialist moves on.
interface ReadinessState {
  active: boolean
  sleep: number
  energy: number
  mood: number
  ts: number
}
const EMPTY: ReadinessState = { active: false, sleep: 0, energy: 0, mood: 0, ts: 0 }

function clampScale(n: unknown, fallback: number): number {
  const v = Number(n)
  return Number.isFinite(v) && v >= 0 && v <= 5 ? Math.round(v) : fallback
}

// GET — either side polls this: the specialist to see the child's live
// answers, the kid page to see whether the specialist has this phase open.
export async function GET(_req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await authorizeSession(params.appointmentId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const state = await redis.get<ReadinessState>(key(params.appointmentId))
    return NextResponse.json({ readiness: state ?? EMPTY })
  } catch {
    return NextResponse.json({ readiness: EMPTY })
  }
}

// POST — EITHER side can write: the child taps a face on their own screen,
// or the specialist fills it in themselves (kept as a fallback — e.g. a
// non-verbal child, or no second device). Partial body — only the field(s)
// present are updated, so one tap doesn't clobber the other two answers.
export async function POST(req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await authorizeSession(params.appointmentId))) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    const rl = await isRateLimited(`session_readiness_post:${params.appointmentId}`, 60, 60)
    if (rl.limited) return NextResponse.json({ ok: false }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return NextResponse.json({ ok: false }, { status: 400 })

    const current = (await redis.get<ReadinessState>(key(params.appointmentId))) ?? { ...EMPTY }
    const next: ReadinessState = {
      active: typeof body.active === 'boolean' ? body.active : current.active,
      sleep: body.sleep !== undefined ? clampScale(body.sleep, current.sleep) : current.sleep,
      energy: body.energy !== undefined ? clampScale(body.energy, current.energy) : current.energy,
      mood: body.mood !== undefined ? clampScale(body.mood, current.mood) : current.mood,
      ts: Date.now(),
    }
    // A fresh readiness phase (active just turned on) starts from a clean
    // slate — otherwise the previous student's answers would flash on
    // screen for the next appointment using the same room key namespace.
    if (body.reset) {
      next.sleep = 0; next.energy = 0; next.mood = 0
    }

    await redis.set(key(params.appointmentId), next, { ex: 3600 })
    await publishSessionEvent(params.appointmentId, 'readiness')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
