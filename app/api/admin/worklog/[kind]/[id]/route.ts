import { NextRequest, NextResponse, after } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import {
  sanitizeClient, sanitizeExpense, sanitizeLesson, sanitizePayment, seriesEditTargets,
  type SeriesPatch, type WorkLesson,
} from '@/lib/worklog'
import { deleteWork, getWork, listWork, putManyWork, putWork, type WorkKind } from '@/lib/worklog-store'
import { archiveLessonsInNotion, resyncFamilyInNotion, syncLessonsToNotion } from '@/lib/worklog-notion-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KINDS: WorkKind[] = ['clients', 'lessons', 'payments', 'expenses']
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
type Ctx = { params: Promise<{ kind: string; id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await isOwnerUser())) return bad('غير مصرح', 401)
  const { kind, id } = await params
  if (!KINDS.includes(kind as WorkKind)) return bad('غير موجود', 404)
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return bad('طلب غير صالح')

  try {
    const current = await getWork(kind as WorkKind, id)
    if (!current) return bad('السجل غير موجود', 404)

    if (kind === 'clients') {
      const c = sanitizeClient(body, true)
      if (!c.ok) return bad(c.error)
      const row = { ...(current as object), ...c.value, id }
      await putWork('clients', row as never)
      // Notion row titles carry the family and child names.
      const was = current as { name?: string; childName?: string }
      if (('name' in c.value && c.value.name !== was.name) || ('childName' in c.value && c.value.childName !== was.childName)) {
        after(() => resyncFamilyInNotion(id))
      }
      return NextResponse.json(row)
    }
    if (kind === 'lessons') {
      const l = sanitizeLesson(body, true)
      if (!l.ok) return bad(l.error)
      if (l.value.clientId && !(await getWork('clients', l.value.clientId))) return bad('العائلة غير موجودة', 404)
      const lesson = current as WorkLesson
      // ?scope=future: carry the schedule fields to every scheduled lesson after this one
      // in its weekly series. Everything else in the body applies to this lesson only.
      if (req.nextUrl.searchParams.get('scope') === 'future' && lesson.seriesId) {
        const patch: SeriesPatch = {}
        for (const k of ['date', 'start', 'durationMin', 'price', 'reminderMin'] as const) {
          if (k in l.value) (patch as Record<string, unknown>)[k] = l.value[k]
        }
        const now = new Date().toISOString()
        const targets = seriesEditTargets(await listWork('lessons'), lesson, patch)
          .map(t => (t.id === id ? { ...t, ...l.value, id, updatedAt: now } : { ...t, updatedAt: now }))
        await putManyWork('lessons', targets)
        after(() => syncLessonsToNotion(targets))
        return NextResponse.json(targets)
      }
      const row = { ...(current as object), ...l.value, id, updatedAt: new Date().toISOString() }
      await putWork('lessons', row as never)
      after(() => syncLessonsToNotion([row as WorkLesson]))
      return NextResponse.json(row)
    }
    // Payments and expenses are re-validated whole: a partial edit must not
    // be able to leave an amount of zero or a date that does not exist.
    if (kind === 'payments') {
      const p = sanitizePayment({ ...(current as object), ...body })
      if (!p.ok) return bad(p.error)
      if (!(await getWork('clients', p.value.clientId))) return bad('العائلة غير موجودة', 404)
      const row = { ...(current as object), ...p.value, id }
      await putWork('payments', row as never)
      return NextResponse.json(row)
    }
    const e = sanitizeExpense({ ...(current as object), ...body })
    if (!e.ok) return bad(e.error)
    const row = { ...(current as object), ...e.value, id }
    await putWork('expenses', row as never)
    return NextResponse.json(row)
  } catch (err) {
    console.error(`[worklog PATCH ${kind}]`, err)
    return bad('تعذّر الحفظ — حاول مجدداً', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await isOwnerUser())) return bad('غير مصرح', 401)
  const { kind, id } = await params
  if (!KINDS.includes(kind as WorkKind)) return bad('غير موجود', 404)

  try {
    if (kind === 'clients') {
      // A family with history is archived, never deleted: deleting it would
      // orphan its lessons and payments and silently change every past total.
      const [lessons, payments] = await Promise.all([listWork('lessons'), listWork('payments')])
      if (lessons.some(l => l.clientId === id) || payments.some(p => p.clientId === id)) {
        return bad('لهذه العائلة حصص أو دفعات مسجّلة — أرشِفها بدل حذفها حتى تبقى الإحصائيات صحيحة', 409)
      }
      await deleteWork('clients', [id])
      return NextResponse.json({ deleted: [id] })
    }

    if (kind === 'lessons' && req.nextUrl.searchParams.get('scope') === 'future') {
      const lesson = await getWork('lessons', id)
      if (!lesson) return bad('السجل غير موجود', 404)
      const ids = lesson.seriesId
        ? (await listWork('lessons'))
            .filter(l => l.seriesId === lesson.seriesId && l.date >= lesson.date && l.status === 'scheduled')
            .map(l => l.id)
        : []
      const all = [...new Set([id, ...ids])]
      await deleteWork('lessons', all)
      after(() => archiveLessonsInNotion(all))
      return NextResponse.json({ deleted: all })
    }

    await deleteWork(kind as WorkKind, [id])
    if (kind === 'lessons') after(() => archiveLessonsInNotion([id]))
    return NextResponse.json({ deleted: [id] })
  } catch (err) {
    console.error(`[worklog DELETE ${kind}]`, err)
    return bad('تعذّر الحذف — حاول مجدداً', 500)
  }
}
