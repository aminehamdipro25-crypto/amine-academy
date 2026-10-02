import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'
import type { CompassRecord, AxisKey } from '@/lib/behavioral-compass'

export const runtime = 'nodejs'

const sanitizeId = (v: unknown) => String(v ?? '').trim().replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 100)
const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const MAX_PER_CHILD = 50

function numOrEmpty(v: unknown): string {
  const s = String(v ?? '').trim()
  return /^\d{1,6}$/.test(s) ? s : ''
}

// GET ?childId= — سجلّ طفل واحد (الأحدث أولاً)
export async function GET(req: NextRequest) {
  if (!await isDashboardUser()) return NextResponse.json({ records: [] }, { status: 401 })
  const childId = sanitizeId(new URL(req.url).searchParams.get('childId'))
  if (!childId) return NextResponse.json({ records: [] })
  const ids = await redis.lrange(`bcompass:child:${childId}`, 0, -1)
  if (!ids.length) return NextResponse.json({ records: [] })
  const rows = await redis.mget<CompassRecord>(ids.map(id => `bcompass:${id}`))
  const records = rows.filter((r): r is CompassRecord => !!r)
  return NextResponse.json({ records })
}

// POST — حفظ نتيجة لطفل مرتبط
export async function POST(req: NextRequest) {
  if (!await isDashboardUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = await req.json().catch(() => null)
    const childId = sanitizeId(body?.childId)
    if (!childId) return NextResponse.json({ error: 'اربط الطفل أولاً لحفظ النتيجة' }, { status: 400 })

    const rawAxes = body?.axes || {}
    const axes = {} as Record<AxisKey, number>
    for (const k of ['A', 'B', 'C', 'D'] as AxisKey[]) {
      const n = Number(rawAxes[k])
      axes[k] = Number.isFinite(n) ? Math.max(0, Math.min(24, Math.round(n))) : 0
    }

    const id = `BC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const record: CompassRecord = {
      id,
      childId,
      childName: str(body?.childName, 80),
      age: str(body?.age, 10),
      appNo: str(body?.appNo, 20) || 'الأول',
      specialist: str(body?.specialist, 120) || undefined,
      createdAt: new Date().toISOString(),
      axes,
      tasksCorrect: Math.max(0, Math.min(13, Number(body?.tasksCorrect) || 0)),
      tasksTotal: Math.max(0, Math.min(13, Number(body?.tasksTotal) || 13)),
      persistenceSec: numOrEmpty(body?.persistenceSec),
      timeToClosureSec: numOrEmpty(body?.timeToClosureSec),
      helpRequests: numOrEmpty(body?.helpRequests),
      helpSpecific: body?.helpSpecific === 'yes' ? 'yes' : body?.helpSpecific === 'no' ? 'no' : '',
      firstClosureSign: str(body?.firstClosureSign, 8),
      finished: ['yes', 'no', 'partly'].includes(body?.finished) ? body.finished : '',
    }

    await redis.set(`bcompass:${id}`, record)
    await redis.lpush(`bcompass:child:${childId}`, id)

    // تقليم السجلّ: احذف الأقدم إن تجاوز الحدّ
    const ids = await redis.lrange(`bcompass:child:${childId}`, 0, -1)
    if (ids.length > MAX_PER_CHILD) {
      for (const old of ids.slice(MAX_PER_CHILD)) await redis.del(`bcompass:${old}`)
      // أعد كتابة القائمة بالمقتطع المسموح (عبر pipeline غير متوفّر هنا؛ نكتفي بحذف السجلّات)
    }

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[behavioral-compass POST]', (err as Error).message)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

// DELETE ?id=&childId= — حذف نتيجة
export async function DELETE(req: NextRequest) {
  if (!await isDashboardUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const url = new URL(req.url)
  const id = sanitizeId(url.searchParams.get('id'))
  const childId = sanitizeId(url.searchParams.get('childId'))
  if (!id) return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 })
  await redis.del(`bcompass:${id}`)
  // اترك المعرّف في قائمة الطفل (سيُقرأ كـ null ويُرشَّح) — تبسيطاً، أو أعد بناء القائمة:
  if (childId) {
    const ids = await redis.lrange(`bcompass:child:${childId}`, 0, -1)
    const remaining = ids.filter(x => x !== id)
    if (remaining.length !== ids.length) {
      await redis.del(`bcompass:child:${childId}`)
      // أعد الإدراج بالترتيب نفسه (الأحدث أولاً): نعكس ثم نرفع
      for (const rid of remaining.slice().reverse()) await redis.lpush(`bcompass:child:${childId}`, rid)
    }
  }
  return NextResponse.json({ ok: true })
}
