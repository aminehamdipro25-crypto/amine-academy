import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:live:${id}` }

// GET — kid page polls this every 3 seconds (no auth needed)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await redis.get<{ exerciseId: string; difficulty: number }>(key(params.id))
    return NextResponse.json({ live: data ?? null })
  } catch {
    return NextResponse.json({ live: null })
  }
}

// POST — specialist publishes current exercise
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const body = await req.json().catch(() => null)
    if (!body?.exerciseId) return NextResponse.json({ error: 'exerciseId مطلوب' }, { status: 400 })
    await redis.set(key(params.id), { exerciseId: body.exerciseId, difficulty: body.difficulty ?? 1 }, { ex: 14400 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

// DELETE — specialist clears exercise (between exercises)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    await redis.del(key(params.id))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
