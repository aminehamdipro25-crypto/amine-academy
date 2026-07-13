import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:reader:${id}` }

// Navigation state of the StoryReader ("مكتبة القصص"), driven by the
// SPECIALIST and mirrored onto the child's screen — which story is open, which
// page, whether we're reading or in the comprehension quiz, and the current
// question/answer feedback. Without this the child ran its own independent
// story library and the specialist could not lead the reading.
interface ReaderState {
  storyId: string | null
  phase: 'pick' | 'read' | 'quiz' | 'done'
  pageIdx: number
  qIdx: number
  selected: number | null
  showFB: boolean
  ts: number
}

const clampInt = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0)

// GET — the child polls this and re-fetches on a 'reader' wake-up.
export async function GET(_req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await authorizeSession(params.appointmentId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const state = await redis.get<ReaderState>(key(params.appointmentId))
    return NextResponse.json({ reader: state ?? null })
  } catch {
    return NextResponse.json({ reader: null })
  }
}

// POST — only the specialist drives the reader.
export async function POST(req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await isDashboardUser())) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    const rl = await isRateLimited(`session_reader_post:${params.appointmentId}`, 120, 60)
    if (rl.limited) return NextResponse.json({ ok: false }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return NextResponse.json({ ok: false }, { status: 400 })
    const phase = ['pick', 'read', 'quiz', 'done'].includes(body.phase) ? body.phase : 'pick'
    const state: ReaderState = {
      storyId: typeof body.storyId === 'string' ? body.storyId.slice(0, 64) : null,
      phase,
      pageIdx: clampInt(body.pageIdx),
      qIdx: clampInt(body.qIdx),
      selected: typeof body.selected === 'number' ? body.selected : null,
      showFB: body.showFB === true,
      ts: Date.now(),
    }
    await redis.set(key(params.appointmentId), state, { ex: 7200 })
    await publishSessionEvent(params.appointmentId, 'reader')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
