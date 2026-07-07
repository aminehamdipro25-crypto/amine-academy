import { NextRequest, NextResponse } from 'next/server'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:kid-status:${id}` }

// GET — specialist polls this every 3 s. Authorized callers only.
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const data = await redis.get<{ exerciseId: string; status: 'active' | 'done'; ts: number }>(key(params.appointmentId))
    return NextResponse.json({ kidStatus: data ?? null })
  } catch {
    return NextResponse.json({ kidStatus: null })
  }
}

// POST — kid page reports status. Authorized callers only (owning parent /
// staff) so status can't be spoofed by an anonymous caller.
export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    const rl = await isRateLimited(`session_kidstatus_post:${params.appointmentId}`, 60, 60)
    if (rl.limited) return NextResponse.json({ ok: false }, { status: 429 })
    const body = await req.json().catch(() => null)
    if (!body?.exerciseId || (body.status !== 'active' && body.status !== 'done')) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    await redis.set(key(params.appointmentId), {
      exerciseId: String(body.exerciseId).slice(0, 64),
      status: body.status,
      ts: Date.now(),
    }, { ex: 7200 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
