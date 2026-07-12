import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { createReport, getStudentReports, getStudent } from '@/lib/db'

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

    const report = await createReport({
      studentId: body.studentId,
      parentId: body.parentId,
      type: ['weekly', 'monthly', 'session'].includes(body.type) ? body.type : 'session',
      periodStart: body.periodStart || new Date().toISOString().slice(0, 10),
      periodEnd: body.periodEnd || new Date().toISOString().slice(0, 10),
      completedExercises: Number(body.completedExercises) || 0,
      totalExercises: Number(body.totalExercises) || 0,
      pointsEarned: Number(body.pointsEarned) || 0,
      behaviorRatings: Array.isArray(body.behaviorRatings) ? body.behaviorRatings : [],
      professorNotes: typeof body.professorNotes === 'string' ? body.professorNotes.slice(0, 3000) : '',
      aiSummary: '',
      improvement,
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
