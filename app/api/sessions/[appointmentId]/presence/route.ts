import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string, role: 'specialist' | 'kid') { return `session:presence:${role}:${id}` }

// Short TTL — a stale key must expire quickly (~15s after a tab closes,
// crashes, loses network, or the child navigates away) so "is X actually
// here right now" stays accurate rather than lingering true long after
// they've left.
// Heartbeats fire every 10s on both sides. A 15s TTL left only a 5s margin, so
// one dropped/slow beat during a brief network blip flashed a false "left"
// indicator until the next beat. 30s absorbs a missed beat while still marking a
// genuinely-gone participant within ~two heartbeats.
const TTL = 30

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

    // Publish only on the FIRST heartbeat of a presence window (when the key
    // didn't exist yet) so "arrived" is instant, without spamming an event on
    // every 10s heartbeat. "Left" is TTL-expiry, which Pusher can't signal —
    // the other side catches that via its background presence poll.
    const existed = await redis.get<string>(key(params.appointmentId, role))
    await redis.set(key(params.appointmentId, role), '1', { ex: TTL })
    if (!existed) await publishSessionEvent(params.appointmentId, 'presence')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
