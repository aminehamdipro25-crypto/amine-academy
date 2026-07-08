import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string, role: 'specialist' | 'kid') { return `session:presence:${role}:${id}` }

// Short TTL — a stale key must expire quickly (~15s after a tab closes,
// crashes, loses network, or the child navigates away) so "is X actually
// here right now" stays accurate rather than lingering true long after
// they've left.
const TTL = 15

// GET — either side checks the OTHER's presence:
//   - parent portal / specialist checks the child's presence, to show
//     "🔴 الطفل غادر الجلسة" instead of silently showing nothing when the
//     kid page closes/crashes/loses connection.
//   - parent portal checks the specialist's presence for "الجلسة جارية الآن".
// Authorized callers only (owning parent / staff).
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const [specialist, kid] = await Promise.all([
      redis.get<string>(key(params.appointmentId, 'specialist')),
      redis.get<string>(key(params.appointmentId, 'kid')),
    ])
    return NextResponse.json({ present: !!specialist, specialistPresent: !!specialist, kidPresent: !!kid })
  } catch {
    return NextResponse.json({ present: false, specialistPresent: false, kidPresent: false })
  }
}

// POST — either side heartbeats this every ~10s while their page is open.
// `role` picks which presence key to touch; each is authorized separately
// so a parent/kid can only ever mark THEIR OWN presence, never the
// specialist's, and vice versa.
export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    const role = body?.role === 'kid' ? 'kid' : 'specialist'

    if (role === 'specialist') {
      if (!await isDashboardUser()) return NextResponse.json({ ok: false }, { status: 401 })
    } else {
      // Kid page authenticates as the owning parent (see middleware.ts) —
      // authorizeSession's parent branch covers this correctly.
      if (!await authorizeSession(params.appointmentId)) {
        return NextResponse.json({ ok: false }, { status: 401 })
      }
    }

    await redis.set(key(params.appointmentId, role), '1', { ex: TTL })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
