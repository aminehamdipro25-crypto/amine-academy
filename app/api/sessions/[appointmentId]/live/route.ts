import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'
import { publishSessionEvent } from '@/lib/realtime-server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:live:${id}` }

// GET — kid page polls this every 3 seconds. Authorized callers only
// (specialist/staff or the owning parent).
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const data = await redis.get<{ exerciseId: string; difficulty: number }>(key(params.appointmentId))
    return NextResponse.json({ live: data ?? null })
  } catch {
    return NextResponse.json({ live: null })
  }
}

// POST — specialist publishes current exercise
export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const rl = await isRateLimited(`session_live_post:${params.appointmentId}`, 60, 60)
    if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة جداً' }, { status: 429 })
    const body = await req.json().catch(() => null)
    if (!body?.exerciseId) return NextResponse.json({ error: 'exerciseId مطلوب' }, { status: 400 })
    await redis.set(key(params.appointmentId), { exerciseId: body.exerciseId, difficulty: body.difficulty ?? 1 }, { ex: 14400 })
    await publishSessionEvent(params.appointmentId, 'live')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

// DELETE — specialist clears exercise (between exercises)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    await redis.del(key(params.appointmentId))
    await publishSessionEvent(params.appointmentId, 'live')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
