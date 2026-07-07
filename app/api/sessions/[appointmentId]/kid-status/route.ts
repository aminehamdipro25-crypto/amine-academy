import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:kid-status:${id}` }

// GET — specialist polls this every 3 s (no auth needed)
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const data = await redis.get<{ exerciseId: string; status: 'active' | 'done'; ts: number }>(key(params.appointmentId))
    return NextResponse.json({ kidStatus: data ?? null })
  } catch {
    return NextResponse.json({ kidStatus: null })
  }
}

// POST — kid page reports status
export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.exerciseId || !body?.status) return NextResponse.json({ ok: false })
    await redis.set(key(params.appointmentId), {
      exerciseId: body.exerciseId,
      status: body.status,
      ts: Date.now(),
    }, { ex: 7200 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
