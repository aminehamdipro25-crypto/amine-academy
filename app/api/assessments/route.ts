import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser, getDashboardActorId } from '@/lib/auth'
import { redis } from '@/lib/redis'
import type { AssessmentResult, AssessmentType } from '@/lib/types'

export const runtime = 'nodejs'

// Typed against the union rather than hand-listed. The hand-written list had
// drifted both ways: it was missing 'vanderbilt-adhd' (so that scale would have
// been rejected with a 400 had it ever been saved from here) while accepting
// 'anxiety' and 'behavior', which are not assessment types at all — a record
// stored under either would render its raw key as the title of a clinical
// document, since no label map has an entry for them.
const VALID_TYPES: AssessmentType[] = [
  'adhd', 'autism', 'learning-difficulties', 'motor',
  'cognitive', 'attention-domains', 'vanderbilt-adhd', 'psc17',
]
const VALID_SEVERITIES = ['none', 'mild', 'moderate', 'severe']

async function requireAdmin(): Promise<boolean> {
  return isDashboardUser()
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json()
    if (!body.studentId || !body.type) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }
    const studentId = String(body.studentId).trim().replace(/[^a-zA-Z0-9-_]/g, '')
    if (!studentId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }
    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: 'نوع التقييم غير صالح' }, { status: 400 })
    }
    if (body.severity && !VALID_SEVERITIES.includes(body.severity)) {
      return NextResponse.json({ error: 'مستوى الشدة غير صالح' }, { status: 400 })
    }
    const id = `AR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    const sessionId = typeof body.sessionId === 'string'
      ? body.sessionId.trim().replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 100)
      : ''
    const result: AssessmentResult = {
      id,
      studentId,
      sessionId: sessionId || undefined,
      type: body.type,
      subtype: body.subtype,
      domainScores: body.domainScores || {},
      totalScore: Number(body.totalScore) || 0,
      severity: body.severity || 'none',
      recommendations: Array.isArray(body.recommendations) ? body.recommendations : [],
      answers: Array.isArray(body.answers) ? body.answers : [],
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      assessedByName: typeof body.assessedByName === 'string' ? body.assessedByName.trim().slice(0, 120) : undefined,
      assessedByActorId: (await getDashboardActorId()) ?? undefined,
      clinicalNotes: typeof body.clinicalNotes === 'string' ? body.clinicalNotes.trim().slice(0, 2000) : undefined,
    }
    await redis.pipeline([
      // No TTL. This is a child's clinical record: the toolkit tells the
      // specialist it is saved "بشكل دائم", the platform's whole improvement
      // claim compares a period against an earlier baseline, and children are
      // followed for years. A one-year expiry silently deleted year one.
      ['SET', `assessment:${id}`, JSON.stringify(result)],
      ['LPUSH', `assessments:student:${result.studentId}`, id],
    ])
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[assessments POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * Correct the two fields the specialist fills AFTER the scales have run.
 *
 * The toolkit saves each result the moment the report opens, and the therapist
 * name is typed on that same screen a moment later — so every record was stored
 * with assessedByName: "". The save effect re-ran when the name changed but
 * found nothing unsaved and returned, so the empty value was permanent. The
 * name reached the printed PDF and never the record, which is also the byline
 * the family now sees in their portal, and the only human attribution on a
 * clinical document.
 *
 * Scores, answers and severity are not editable here: those are the measurement.
 */
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => null)
    if (!body?.id) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

    const id = String(body.id).replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 100)
    if (!id) return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 })

    const existing = await redis.get<AssessmentResult>(`assessment:${id}`)
    if (!existing) return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 })

    const updates: Partial<AssessmentResult> = {}
    if (typeof body.assessedByName === 'string') {
      updates.assessedByName = body.assessedByName.trim().slice(0, 120) || undefined
    }
    if (typeof body.clinicalNotes === 'string') {
      updates.clinicalNotes = body.clinicalNotes.trim().slice(0, 2000) || undefined
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'لا توجد حقول قابلة للتعديل' }, { status: 400 })
    }

    // redis.set serialises internally — see lib/db.ts updateExercise.
    await redis.set(`assessment:${id}`, { ...existing, ...updates })
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[assessments PATCH]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ results: [] }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    if (!studentId) return NextResponse.json({ results: [] })
    const sanitized = String(studentId).replace(/[^a-zA-Z0-9-_]/g, '')
    if (!sanitized) return NextResponse.json({ results: [] })
    // The whole history. Five scales per session means a cap of 21 hid the
    // first session after only four, which is also what the report's
    // scale-to-scale comparison reads back.
    const ids = await redis.lrange(`assessments:student:${sanitized}`, 0, -1)
    const results = await Promise.all(
      ids.map(id => redis.get<AssessmentResult>(`assessment:${id}`))
    )
    return NextResponse.json({ results: results.filter(Boolean) })
  } catch (err) {
    console.error('[assessments GET]', err)
    return NextResponse.json({ results: [] })
  }
}
