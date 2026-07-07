import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:wb:${id}` }

// Stroke: c=color, s=size, e=eraser, p=flat normalized points [x1,y1,x2,y2,...]
export interface WBStroke { c: string; s: number; e: boolean; p: number[] }
export interface WBState { active: boolean; strokes: WBStroke[]; rev: number }

const EMPTY: WBState = { active: false, strokes: [], rev: 0 }
const MAX_STROKES = 600
const TTL = 7200

// GET — kid/parent page polls this (no auth; strokes contain no PII)
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const wb = await redis.get<WBState>(key(params.appointmentId))
    return NextResponse.json({ wb: wb ?? EMPTY })
  } catch {
    return NextResponse.json({ wb: EMPTY })
  }
}

// POST — specialist mutates the board: open / close / stroke / undo / clear
export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const body = await req.json().catch(() => null)
    if (!body?.action) return NextResponse.json({ error: 'action مطلوب' }, { status: 400 })

    const k = key(params.appointmentId)
    const wb = (await redis.get<WBState>(k)) ?? { ...EMPTY }

    switch (body.action) {
      case 'open':
        wb.active = true
        break
      case 'close':
        wb.active = false
        break
      case 'stroke': {
        const s = body.stroke as WBStroke | undefined
        if (!s || !Array.isArray(s.p) || s.p.length < 2) {
          return NextResponse.json({ error: 'stroke غير صالح' }, { status: 400 })
        }
        // Cap stroke payload and total strokes to keep the Redis value bounded
        wb.strokes.push({ c: String(s.c).slice(0, 9), s: Math.min(Number(s.s) || 3, 60), e: !!s.e, p: s.p.slice(0, 2000).map(Number) })
        if (wb.strokes.length > MAX_STROKES) wb.strokes = wb.strokes.slice(-MAX_STROKES)
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
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
