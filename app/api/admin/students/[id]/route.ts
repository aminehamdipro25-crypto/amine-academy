import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getStudent, updateStudent } from '@/lib/db'
import { audit } from '@/lib/audit'
import type { Diagnosis } from '@/lib/types'

export const runtime = 'nodejs'

const VALID_DIAGNOSES: Diagnosis[] = ['ADHD', 'AUTISM', 'ADHD+AUTISM', 'OTHER']

/**
 * Correct a child's profile after an assessment.
 *
 * The clinical area of concern is recorded when the child is first added —
 * necessarily before any scale has been run, since that record is what the
 * assessment gets filed against. Without this endpoint that first, provisional
 * answer was permanent: nothing in the dashboard could change it once the
 * assessment actually said something.
 *
 * Deliberately narrow: only the two fields the assessment informs. Names and
 * birth dates are identity, not findings, and are not editable here.
 */
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  if (!(await isDashboardUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const { id } = await props.params
    const studentId = String(id ?? '').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 80)
    if (!studentId) return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 })

    const student = await getStudent(studentId)
    if (!student) return NextResponse.json({ error: 'الطفل غير موجود' }, { status: 404 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })

    const updates: { diagnosis?: Diagnosis; severityLevel?: 1 | 2 | 3 } = {}

    if (body.diagnosis !== undefined) {
      if (!VALID_DIAGNOSES.includes(body.diagnosis)) {
        return NextResponse.json({ error: 'تشخيص غير معروف' }, { status: 400 })
      }
      updates.diagnosis = body.diagnosis
    }
    if (body.severityLevel !== undefined) {
      const n = Number(body.severityLevel)
      if (![1, 2, 3].includes(n)) {
        return NextResponse.json({ error: 'مستوى شدّة غير صالح' }, { status: 400 })
      }
      updates.severityLevel = n as 1 | 2 | 3
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'لا توجد حقول قابلة للتعديل' }, { status: 400 })
    }

    await updateStudent(studentId, updates)
    await audit({
      action: 'student_profile_update',
      actorId: 'admin',
      actorRole: 'admin',
      targetId: studentId,
      // Keep what it was, so a later reviewer can see the profile was revised
      // after assessment rather than silently differing from the intake record.
      meta: {
        fromDiagnosis: student.diagnosis,
        fromSeverity: student.severityLevel,
        ...(updates.diagnosis ? { toDiagnosis: updates.diagnosis } : {}),
        ...(updates.severityLevel ? { toSeverity: updates.severityLevel } : {}),
      },
    })

    return NextResponse.json({ ok: true, student: { ...student, ...updates } })
  } catch (e) {
    console.error('[admin/students PATCH]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
