import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { isOwnerUser } from '@/lib/auth'
import {
  sanitizeClient, sanitizeExpense, sanitizeLesson, sanitizePayment, weeklySeries,
  type WorkClient, type WorkLesson,
} from '@/lib/worklog'
import { getWork, listWork, newWorkId, nextClientColor, putManyWork, putWork, type WorkKind } from '@/lib/worklog-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KINDS: WorkKind[] = ['clients', 'lessons', 'payments', 'expenses']
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await isOwnerUser())) return bad('غير مصرح', 401)
  const { kind } = await params
  if (!KINDS.includes(kind as WorkKind)) return bad('غير موجود', 404)
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return bad('طلب غير صالح')
  const now = new Date().toISOString()

  try {
    if (kind === 'clients') {
      const c = sanitizeClient(body)
      if (!c.ok) return bad(c.error)
      const existing = await listWork('clients')
      const row: WorkClient = {
        ...(c.value as Omit<WorkClient, 'id' | 'createdAt' | 'color'>),
        id: newWorkId('clients'),
        color: c.value.color ?? nextClientColor(existing),
        createdAt: now,
      }
      await putWork('clients', row)
      return NextResponse.json(row, { status: 201 })
    }

    if (kind === 'lessons') {
      const l = sanitizeLesson(body)
      if (!l.ok) return bad(l.error)
      if (!(await getWork('clients', l.value.clientId!))) return bad('العائلة غير موجودة', 404)
      const repeat = Math.min(52, Math.max(1, Math.floor(Number(body.repeatWeeks) || 1)))
      const seriesId = repeat > 1 ? `ser_${randomUUID()}` : undefined
      const rows: WorkLesson[] = weeklySeries(l.value.date!, repeat).map(date => ({
        ...(l.value as Omit<WorkLesson, 'id' | 'createdAt' | 'updatedAt' | 'date'>),
        id: newWorkId('lessons'),
        date,
        // A future repeat cannot already be done: only the first lesson keeps the chosen status.
        status: date === l.value.date ? l.value.status! : 'scheduled',
        ...(date === l.value.date ? {} : { cancelledBy: undefined, charged: false }),
        seriesId,
        createdAt: now,
        updatedAt: now,
      }))
      await putManyWork('lessons', rows)
      return NextResponse.json(rows, { status: 201 })
    }

    if (kind === 'payments') {
      const p = sanitizePayment(body)
      if (!p.ok) return bad(p.error)
      if (!(await getWork('clients', p.value.clientId))) return bad('العائلة غير موجودة', 404)
      if (p.value.lessonId) {
        const l = await getWork('lessons', p.value.lessonId)
        if (!l || l.clientId !== p.value.clientId) return bad('الحصة لا تخصّ هذه العائلة')
      }
      const row = { ...p.value, id: newWorkId('payments'), createdAt: now }
      await putWork('payments', row)
      return NextResponse.json(row, { status: 201 })
    }

    const e = sanitizeExpense(body)
    if (!e.ok) return bad(e.error)
    const row = { ...e.value, id: newWorkId('expenses'), createdAt: now }
    await putWork('expenses', row)
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    console.error(`[worklog POST ${kind}]`, err)
    return bad('تعذّر الحفظ — حاول مجدداً', 500)
  }
}
