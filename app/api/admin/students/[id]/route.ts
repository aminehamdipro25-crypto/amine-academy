import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getStudent, updateStudent } from '@/lib/db'
import { audit } from '@/lib/audit'
import type { AgeGroup, Diagnosis } from '@/lib/types'
import { ageGroupFromBirthDate, ageYearsFromBirthDate } from '@/lib/age'

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
 * Deliberately narrow: only the fields the assessment informs. Names are
 * identity and are not editable here.
 *
 * Birth date is a special case. Changing one is identity editing and stays
 * refused. But a record that has NO birth date could not be completed from
 * anywhere in the platform: the toolkit disables its date field for any linked
 * child, so the specialist faced an empty, greyed-out box, an empty age, and no
 * other screen that would take the value. The age matters clinically — the
 * learning-difficulties scale is withheld below 8 and the DSM-5 symptom
 * threshold drops at 17 — so an unfillable gap is not a safe default.
 * Filling an absent date is therefore allowed; overwriting a present one is not.
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

    const updates: { diagnosis?: Diagnosis; severityLevel?: 1 | 2 | 3; birthDate?: string; ageGroup?: AgeGroup } = {}

    if (body.birthDate !== undefined) {
      if (student.birthDate) {
        return NextResponse.json(
          { error: 'تاريخ الميلاد مسجّل بالفعل ولا يُعدَّل من هنا' },
          { status: 400 },
        )
      }
      const birthDate = String(body.birthDate ?? '').slice(0, 10)
      // ageYearsFromBirthDate rejects the shapes Date would silently accept and
      // roll forward (2025-02-30, 2025-13-01) as well as dates in the future.
      const years = ageYearsFromBirthDate(birthDate)
      if (years === null) {
        return NextResponse.json({ error: 'تاريخ ميلاد غير صالح' }, { status: 400 })
      }
      updates.birthDate = birthDate
      // Kept consistent with the date rather than left at whatever was guessed
      // at intake — the catalogue gates exercises on this band.
      updates.ageGroup = ageGroupFromBirthDate(birthDate)
    }

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
        ...(updates.birthDate ? { setBirthDate: updates.birthDate, toAgeGroup: updates.ageGroup } : {}),
      },
    })

    return NextResponse.json({ ok: true, student: { ...student, ...updates } })
  } catch (e) {
    console.error('[admin/students PATCH]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
