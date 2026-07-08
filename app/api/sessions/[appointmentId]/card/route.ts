import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:card:${id}` }

// Only the card id travels over the wire — both pages import the same
// PROMPT_CARDS constant (lib/session-constants.ts) and look up the full
// {text, emoji, bg, glow} definition locally.
interface CardState { cardId: string | null }
const EMPTY: CardState = { cardId: null }

// GET — kid page polls this to mirror the specialist's prompt card overlay.
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const state = await redis.get<CardState>(key(params.appointmentId))
    return NextResponse.json({ card: state ?? EMPTY })
  } catch {
    return NextResponse.json({ card: EMPTY })
  }
}

// POST — specialist shows/hides a prompt card
export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const rl = await isRateLimited(`session_card_post:${params.appointmentId}`, 60, 60)
    if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة جداً' }, { status: 429 })

    const body = await req.json().catch(() => null)
    const cardId = body?.cardId === null ? null : String(body?.cardId ?? '').slice(0, 40) || null
    const state: CardState = { cardId }
    await redis.set(key(params.appointmentId), state, { ex: 7200 })
    await publishSessionEvent(params.appointmentId, 'card')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
