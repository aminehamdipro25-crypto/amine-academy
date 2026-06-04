import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { createReport, getStudentReports, getStudent } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!await verifyAdminSession(token)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body?.studentId || !body?.parentId)
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })

    const student = await getStudent(body.studentId)
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })

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
    })

    return NextResponse.json({ ok: true, report })
  } catch (e) {
    console.error('[admin/reports]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!await verifyAdminSession(token)) {
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
