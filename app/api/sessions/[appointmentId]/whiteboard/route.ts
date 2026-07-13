import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:wb:${id}` }

// Stroke: c=color, s=size, e=eraser, p=flat normalized points [x1,y1,x2,y2,...]
// ar = specialist canvas aspect ratio (w/h) so the kid can letterbox its own
// canvas to match and replay strokes without geometric distortion.
export interface WBStroke { c: string; s: number; e: boolean; p: number[] }
export interface WBState { active: boolean; strokes: WBStroke[]; rev: number; ar?: number }

const EMPTY: WBState = { active: false, strokes: [], rev: 0, ar: 4 / 3 }
const MAX_STROKES = 600
const TTL = 7200

// GET — kid/parent page polls this. Authorized callers only.
export async function GET(_req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await authorizeSession(params.appointmentId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const wb = await redis.get<WBState>(key(params.appointmentId))
    return NextResponse.json({ wb: wb ?? EMPTY })
  } catch {
    return NextResponse.json({ wb: EMPTY })
  }
}

// POST — specialist mutates the board: open / close / stroke / undo / clear
export async function POST(req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  try {
    if (!(await isDashboardUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    // Generous cap — a fast-drawing specialist can lift the pen a few times a
    // second; this only guards against runaway/malicious flooding.
    const rl = await isRateLimited(`session_wb_post:${params.appointmentId}`, 300, 60)
    if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة جداً' }, { status: 429 })
    const body = await req.json().catch(() => null)
    if (!body?.action) return NextResponse.json({ error: 'action مطلوب' }, { status: 400 })

    const k = key(params.appointmentId)
    const wb = (await redis.get<WBState>(k)) ?? { ...EMPTY }

    // Track the specialist's canvas aspect ratio (sent with open/stroke)
    if (typeof body.ar === 'number' && body.ar > 0.1 && body.ar < 10) wb.ar = body.ar

    switch (body.action) {
      case 'open':
        // Idempotent — only bump rev on the FIRST open, so the specialist's
        // 3s "open" heartbeat (which guards against a dropped open POST) does
        // not force the child to redraw on every tick.
        if (!wb.active) { wb.active = true; wb.rev++ }
        break
      case 'close':
        wb.active = false
        wb.rev++
        break
      case 'stroke': {
        const s = body.stroke as WBStroke | undefined
        if (!s || !Array.isArray(s.p) || s.p.length < 2) {
          return NextResponse.json({ error: 'stroke غير صالح' }, { status: 400 })
        }
        // Cap stroke payload and total strokes to keep the Redis value bounded
        wb.strokes.push({ c: String(s.c).slice(0, 9), s: Math.min(Number(s.s) || 3, 60), e: !!s.e, p: s.p.slice(0, 2000).map(Number) })
        if (wb.strokes.length > MAX_STROKES) wb.strokes = wb.strokes.slice(-MAX_STROKES)
        wb.rev++
        break
      }
      case 'undo':
        wb.strokes.pop()
        wb.rev++
        break
      case 'clear':
        wb.strokes = []
        wb.rev++
        break
      default:
        return NextResponse.json({ error: 'action غير معروف' }, { status: 400 })
    }

    await redis.set(k, wb, { ex: TTL })
    await publishSessionEvent(params.appointmentId, 'whiteboard')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
