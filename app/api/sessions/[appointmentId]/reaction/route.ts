import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:reaction:${id}` }

// A one-shot encouragement burst the specialist fires at the child (a star,
// a celebration, a clap…). Unlike the other channels this is a transient
// EVENT, not persistent state: the child animates it once and moves on. We
// store {type, id} where `id` is a monotonic-ish nonce so the child can tell
// a NEW reaction from the same one seen on a later poll (and so the same
// emoji fired twice in a row still re-triggers).
const ALLOWED = ['star', 'celebrate', 'clap', 'love', 'rainbow', 'thumbs'] as const
type ReactionType = (typeof ALLOWED)[number]
interface ReactionState { type: ReactionType; id: number }

// GET — the kid page polls this and re-fetches on a 'reaction' wake-up.
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const data = await redis.get<ReactionState>(key(params.appointmentId))
    return NextResponse.json({ reaction: data ?? null })
  } catch {
    return NextResponse.json({ reaction: null })
  }
}

// POST — only the specialist/staff fires reactions (never the child).
export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    const rl = await isRateLimited(`session_reaction_post:${params.appointmentId}`, 60, 60)
    if (rl.limited) return NextResponse.json({ ok: false }, { status: 429 })

    const body = await req.json().catch(() => null)
    const type = body?.type as string
    if (!ALLOWED.includes(type as ReactionType)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    const state: ReactionState = { type: type as ReactionType, id: Date.now() }
    // Short TTL — a reaction is only relevant for the few seconds it takes the
    // child to see it; it must never replay in a later session.
    await redis.set(key(params.appointmentId), state, { ex: 60 })
    await publishSessionEvent(params.appointmentId, 'reaction')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
