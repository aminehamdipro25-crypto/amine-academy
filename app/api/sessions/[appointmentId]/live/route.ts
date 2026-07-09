import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:live:${id}` }

// GET — kid page polls this every 3 seconds. Authorized callers only
// (specialist/staff or the owning parent).
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const data = await redis.get<{ exerciseId: string; difficulty: number; seed?: number; locked?: boolean }>(key(params.appointmentId))
    return NextResponse.json({ live: data ?? null })
  } catch {
    return NextResponse.json({ live: null })
  }
}

// POST — specialist publishes current exercise
export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const rl = await isRateLimited(`session_live_post:${params.appointmentId}`, 60, 60)
    if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة جداً' }, { status: 429 })
    const body = await req.json().catch(() => null)
    if (!body?.exerciseId) return NextResponse.json({ error: 'exerciseId مطلوب' }, { status: 400 })
    // `seed` (minted once by the specialist per exercise activation) lets
    // exercises that shuffle their own content reproduce the EXACT same
    // layout on the child's screen instead of each side randomizing
    // independently — see lib/seeded-random.ts.
    const seed = Number.isFinite(body.seed) ? Math.trunc(body.seed) : undefined
    // `locked` = the specialist has locked the session to keep the child on
    // the current exercise; the kid page then ignores the child's own "exit"
    // tap so they can't wander off mid-task.
    const locked = body.locked === true
    await redis.set(key(params.appointmentId), { exerciseId: body.exerciseId, difficulty: body.difficulty ?? 1, seed, locked }, { ex: 14400 })
    await publishSessionEvent(params.appointmentId, 'live')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

// DELETE — specialist clears exercise (between exercises)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    await redis.del(key(params.appointmentId))
    await publishSessionEvent(params.appointmentId, 'live')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
