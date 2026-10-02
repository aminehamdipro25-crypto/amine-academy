import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'
import type { GeneratedTool } from '@/lib/behavioral-compass'

export const runtime = 'nodejs'

const LIST_KEY = 'bcompass:tools'
const sanitizeId = (v: unknown) => String(v ?? '').trim().replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 100)
const MAX_TOOLS = 100

// GET — مكتبة الأدوات المولّدة (الأحدث أولاً)
export async function GET() {
  if (!await isDashboardUser()) return NextResponse.json({ tools: [] }, { status: 401 })
  const ids = await redis.lrange(LIST_KEY, 0, -1)
  if (!ids.length) return NextResponse.json({ tools: [] })
  const rows = await redis.mget<GeneratedTool>(ids.map(id => `bcompass:tool:${id}`))
  const tools = rows.filter((t): t is GeneratedTool => !!t)
  return NextResponse.json({ tools })
}

// POST — حفظ أداة مولّدة في المكتبة
export async function POST(req: NextRequest) {
  if (!await isDashboardUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = await req.json().catch(() => null)
    const tool = body?.tool as GeneratedTool | undefined
    if (!tool?.title || !Array.isArray(tool.selfReport?.items) || tool.selfReport.items.length < 6) {
      return NextResponse.json({ error: 'أداة غير صالحة' }, { status: 400 })
    }
    const id = `TL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const record: GeneratedTool = { ...tool, id, createdAt: new Date().toISOString() }
    await redis.set(`bcompass:tool:${id}`, record)
    await redis.lpush(LIST_KEY, id)

    const ids = await redis.lrange(LIST_KEY, 0, -1)
    if (ids.length > MAX_TOOLS) for (const old of ids.slice(MAX_TOOLS)) await redis.del(`bcompass:tool:${old}`)

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[bcompass tools POST]', (err as Error).message)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

// DELETE ?id= — حذف أداة من المكتبة
export async function DELETE(req: NextRequest) {
  if (!await isDashboardUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const id = sanitizeId(new URL(req.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 })
  await redis.del(`bcompass:tool:${id}`)
  const ids = await redis.lrange(LIST_KEY, 0, -1)
  const remaining = ids.filter(x => x !== id)
  if (remaining.length !== ids.length) {
    await redis.del(LIST_KEY)
    for (const rid of remaining.slice().reverse()) await redis.lpush(LIST_KEY, rid)
  }
  return NextResponse.json({ ok: true })
}
