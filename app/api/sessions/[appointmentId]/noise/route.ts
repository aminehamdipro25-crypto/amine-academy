import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:noise:${id}` }

const VALID_MODES = ['white', 'rain', 'focus', 'calm', 'theta']

// customUrl carries a real HTTPS audio URL the specialist pasted (see the
// "share audio link" flow) — this is DISTINCT from local-device file
// uploads, which create a blob: URL that only ever exists inside the
// specialist's own browser and can never reach the child no matter how the
// state is synced. When customUrl is set, the kid page plays that URL
// directly instead of running the synthesized engine.
interface NoiseState { active: boolean; mode: string; customUrl?: string | null }
const EMPTY: NoiseState = { active: false, mode: 'calm', customUrl: null }

// GET — kid page polls this; when active, it runs the SAME synthesis
// locally (there's no audio file to stream — see lib/noise-synth.ts), or
// plays customUrl directly if one is set.
export async function GET(_req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await authorizeSession(params.appointmentId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const state = await redis.get<NoiseState>(key(params.appointmentId))
    return NextResponse.json({ noise: state ?? EMPTY })
  } catch {
    return NextResponse.json({ noise: EMPTY })
  }
}

// POST — specialist starts/stops the noise engine or a shared audio link,
// or changes mode
export async function POST(req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await isDashboardUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const rl = await isRateLimited(`session_noise_post:${params.appointmentId}`, 60, 60)
    if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة جداً' }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (typeof body?.active !== 'boolean') {
      return NextResponse.json({ error: 'active مطلوب' }, { status: 400 })
    }
    const mode = VALID_MODES.includes(body.mode) ? body.mode : EMPTY.mode

    let customUrl: string | null = null
    if (body.customUrl) {
      try {
        const parsed = new URL(String(body.customUrl))
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') customUrl = parsed.toString()
      } catch { /* invalid URL — drop it, don't 400 the whole request */ }
    }

    const state: NoiseState = { active: body.active, mode, customUrl }
    await redis.set(key(params.appointmentId), state, { ex: 7200 })
    await publishSessionEvent(params.appointmentId, 'noise')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
