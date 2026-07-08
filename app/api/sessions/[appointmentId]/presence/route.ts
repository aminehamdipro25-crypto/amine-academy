import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:presence:${id}` }

// Short TTL — a stale key must expire quickly (~15s after the specialist's
// tab closes/crashes/loses network) so "is the specialist actually here"
// stays accurate rather than lingering true long after they've left.
const TTL = 15

// GET — parent portal checks this to show "الجلسة جارية الآن" only when the
// specialist genuinely has the session open, not just because the scheduled
// time window is near. Authorized callers only (owning parent / staff).
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const present = await redis.get<string>(key(params.appointmentId))
    return NextResponse.json({ present: !!present })
  } catch {
    return NextResponse.json({ present: false })
  }
}

// POST — specialist's session page heartbeats this every ~10s while open.
export async function POST(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) return NextResponse.json({ ok: false }, { status: 401 })
    await redis.set(key(params.appointmentId), '1', { ex: TTL })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
