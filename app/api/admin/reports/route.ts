import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { createReport, getStudentReports, getStudent, getStudentApaRecords } from '@/lib/db'
import { filterApaRecordsByPeriod, summarizeApaRecords } from '@/lib/apa-record'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body?.studentId || !body?.parentId)
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })

    const student = await getStudent(body.studentId)
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
    // Data-integrity: the report must be filed under the child's actual parent,
    // not a client-supplied parentId — otherwise it could surface in the wrong
    // parent's portal.
    if (student.parentId !== body.parentId) {
      return NextResponse.json({ error: 'الطفل لا ينتمي لولي الأمر المحدد' }, { status: 400 })
    }

    // Documented improvement badge — only trust it when the client sends three
    // finite numbers derived from real gameplay; otherwise store null.
    const imp = body.improvement
    const improvement =
      imp && Number.isFinite(imp.accuracyDelta) && Number.isFinite(imp.currentAccuracy) && Number.isFinite(imp.previousAccuracy)
        ? {
            accuracyDelta: Math.round(imp.accuracyDelta),
            currentAccuracy: Math.round(imp.currentAccuracy),
            previousAccuracy: Math.round(imp.previousAccuracy),
          }
        : null

    const periodStart = body.periodStart || new Date().toISOString().slice(0, 10)
    const periodEnd = body.periodEnd || new Date().toISOString().slice(0, 10)

    // Adapted Physical Activity roll-up. Recomputed here from the child's filed
    // records rather than trusting a client-supplied summary — the parent's
    // document must never be able to carry physical-activity numbers that no
    // filed session backs. Never fails the report: a child with no APA sessions
    // simply gets no APA section.
    let apa = null
    try {
      const records = await getStudentApaRecords(body.studentId)
      apa = summarizeApaRecords(filterApaRecordsByPeriod(records, periodStart, periodEnd))
    } catch (e) {
      console.error('[admin/reports] APA roll-up failed', e)
    }

    const report = await createReport({
      studentId: body.studentId,
      parentId: body.parentId,
      type: ['weekly', 'monthly', 'session'].includes(body.type) ? body.type : 'session',
      periodStart,
      periodEnd,
      completedExercises: Number(body.completedExercises) || 0,
      totalExercises: Number(body.totalExercises) || 0,
      pointsEarned: Number(body.pointsEarned) || 0,
      behaviorRatings: Array.isArray(body.behaviorRatings) ? body.behaviorRatings : [],
      professorNotes: typeof body.professorNotes === 'string' ? body.professorNotes.slice(0, 3000) : '',
      aiSummary: '',
      improvement,
      apa,
    })

    return NextResponse.json({ ok: true, report })
  } catch (e) {
    console.error('[admin/reports]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const studentId = new URL(req.url).searchParams.get('studentId')
    if (!studentId) return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 })

    const reports = await getStudentReports(studentId)
    return NextResponse.json({ reports })
  } catch (e) {
    console.error('[admin/reports/get]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
