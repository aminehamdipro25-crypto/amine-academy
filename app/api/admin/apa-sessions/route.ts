import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { createApaRecord, getStudent, getStudentApaRecords, getStudentReports } from '@/lib/db'
import { filterApaRecordsByPeriod, sanitizeApaRecord, summarizeApaRecords } from '@/lib/apa-record'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'

/** Strip anything that is not a legal id character before it reaches a Redis key. */
function cleanId(raw: unknown): string {
  return String(raw ?? '').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 80)
}

/**
 * File one Adapted Physical Activity session for a child.
 *
 * Phase names and indicator labels are intersected against the authored plan in
 * sanitizeApaRecord, so a crafted payload cannot put arbitrary text into what a
 * parent eventually reads.
 */
export async function POST(req: NextRequest) {
  if (!(await isDashboardUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => null)
    const studentId = cleanId(body?.studentId)
    if (!studentId) {
      return NextResponse.json({ error: 'يجب اختيار الطفل' }, { status: 400 })
    }
    const student = await getStudent(studentId)
    if (!student) {
      return NextResponse.json({ error: 'الطفل غير موجود' }, { status: 404 })
    }

    const clean = sanitizeApaRecord(body, studentId)
    if (!clean) {
      return NextResponse.json({ error: 'الحالة أو الفئة العمرية غير معروفة' }, { status: 400 })
    }
    if (clean.indicators.length === 0 && clean.phasesCompleted.length === 0) {
      return NextResponse.json({ error: 'سجّل مرحلة واحدة على الأقل أو قيّم مؤشراً واحداً' }, { status: 400 })
    }

    const record = await createApaRecord(clean)
    await audit({
      action: 'apa_session_record',
      actorId: 'admin',
      actorRole: 'admin',
      targetId: studentId,
      meta: { condition: clean.condition, band: clean.band, date: clean.date },
    })
    return NextResponse.json({ ok: true, record })
  } catch (e) {
    console.error('[admin/apa-sessions POST]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

/**
 * A child's filed APA sessions, plus the period roll-up the report form uses.
 * `from`/`to` are optional YYYY-MM-DD bounds; without them the whole history
 * is summarized.
 */
export async function GET(req: NextRequest) {
  if (!(await isDashboardUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const url = new URL(req.url)
    const studentId = cleanId(url.searchParams.get('studentId'))
    if (!studentId) {
      return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 })
    }

    const all = await getStudentApaRecords(studentId)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const scoped = from && to ? filterApaRecordsByPeriod(all, from, to) : all

    // How many sessions have piled up since the family last received a report.
    // Reporting cadence is per child (every 2-3 sessions), so the dashboard needs
    // the count rather than the specialist keeping it in their head.
    let sinceLastReport = all.length
    let lastReportAt: string | null = null
    try {
      const reports = await getStudentReports(studentId)
      const latest = reports
        .map(r => r.createdAt)
        .sort()
        .pop()
      if (latest) {
        lastReportAt = latest
        const cutoff = latest.slice(0, 10)
        sinceLastReport = all.filter(r => r.date > cutoff).length
      }
    } catch (e) {
      console.error('[admin/apa-sessions] report lookup failed', e)
    }

    return NextResponse.json({
      records: scoped,
      summary: summarizeApaRecords(scoped),
      totalFiled: all.length,
      sinceLastReport,
      lastReportAt,
    })
  } catch (e) {
    console.error('[admin/apa-sessions GET]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
