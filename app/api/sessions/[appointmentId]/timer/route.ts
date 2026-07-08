import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:timer:${id}` }

// `left`/`ts` are a snapshot, not a live tick — the kid page derives the
// CURRENT displayed value by adding/subtracting elapsed wall-clock time
// since `ts` while `running` is true. Storing a moving number and trying to
// poll it precisely would drift/jitter; a snapshot + client-side
// extrapolation stays smooth between polls and self-corrects on each one.
interface TimerState {
  active: boolean
  total: number
  countUp: boolean
  running: boolean
  left: number
  ts: number
}
const EMPTY: TimerState = { active: false, total: 120, countUp: false, running: false, left: 120, ts: 0 }
const MAX_SECONDS = 3600

// GET — kid page polls this to mirror the specialist's visible timer.
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const state = await redis.get<TimerState>(key(params.appointmentId))
    return NextResponse.json({ timer: state ?? EMPTY })
  } catch {
    return NextResponse.json({ timer: EMPTY })
  }
}

// POST — specialist publishes a timer snapshot on every meaningful change
// (start, pause/resume, reset, show/hide).
export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const rl = await isRateLimited(`session_timer_post:${params.appointmentId}`, 120, 60)
    if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة جداً' }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (typeof body?.active !== 'boolean') {
      return NextResponse.json({ error: 'active مطلوب' }, { status: 400 })
    }
    const clampSecs = (n: unknown, fallback: number) =>
      typeof n === 'number' && Number.isFinite(n) ? Math.min(MAX_SECONDS, Math.max(0, Math.round(n))) : fallback

    const state: TimerState = {
      active: body.active,
      total: clampSecs(body.total, EMPTY.total),
      countUp: !!body.countUp,
      running: !!body.running,
      left: clampSecs(body.left, EMPTY.left),
      ts: Date.now(),
    }
    await redis.set(key(params.appointmentId), state, { ex: 7200 })
    await publishSessionEvent(params.appointmentId, 'timer')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
