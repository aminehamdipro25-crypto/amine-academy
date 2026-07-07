import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { authorizeSession } from '@/lib/session-access'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

function key(id: string) { return `session:content:${id}` }

// GET — parent/kid page polls this. Authorized callers only.
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const data = await redis.get<{ url: string }>(key(params.appointmentId))
    return NextResponse.json({ contentUrl: data?.url ?? null })
  } catch {
    return NextResponse.json({ contentUrl: null })
  }
}

// POST — specialist shares a URL (must be an http(s) URL — no javascript:/data:)
export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const body = await req.json().catch(() => null)
    if (!body?.url) return NextResponse.json({ error: 'url مطلوب' }, { status: 400 })
    let parsed: URL
    try { parsed = new URL(String(body.url)) } catch { return NextResponse.json({ error: 'رابط غير صالح' }, { status: 400 }) }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ error: 'رابط غير صالح' }, { status: 400 })
    }
    await redis.set(key(params.appointmentId), { url: parsed.toString() }, { ex: 7200 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

// DELETE — specialist stops sharing
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await isDashboardUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    await redis.del(key(params.appointmentId))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
