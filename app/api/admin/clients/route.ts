import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { isDashboardUser } from '@/lib/auth'
import { createParent, createStudent, getParentByEmail, updateParent } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { audit } from '@/lib/audit'
import { ageGroupFromBirthDate } from '@/lib/age'
import type { Diagnosis } from '@/lib/types'

export const runtime = 'nodejs'

const VALID_DIAGNOSES: Diagnosis[] = ['ADHD', 'AUTISM', 'ADHD+AUTISM', 'OTHER']

function str(v: unknown, max: number): string {
  return String(v ?? '').trim().slice(0, max)
}

/**
 * Create a portal account for a child the specialist already treats in person.
 *
 * Before this the only way in was the public /register flow, which demands a
 * password, a plan and a payment path — none of which apply to a family that
 * is already being seen face to face. This creates the account directly:
 * active, no plan expiry, and marked accountType 'in-person' so the portal
 * never shows them a plan badge or an upgrade prompt.
 *
 * The account is created with a random password nobody ever sees. The family
 * gets in through the owner-only reset link (/api/admin/reset-parent-link),
 * which the specialist hands over directly — so no credential is ever emailed
 * to an address that has not been confirmed in person.
 */
export async function POST(req: NextRequest) {
  if (!(await isDashboardUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })

    const parentIn = body.parent ?? {}
    const childIn = body.child ?? {}

    const firstName = str(parentIn.firstName, 50)
    const lastName = str(parentIn.lastName, 50)
    const email = str(parentIn.email, 120).toLowerCase()
    const childFirstName = str(childIn.firstName, 50)
    const birthDate = str(childIn.birthDate, 10)

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'اسم ولي الأمر غير مكتمل' }, { status: 400 })
    }
    // Deliberately permissive but non-empty: the address is confirmed with the
    // family in person, this only catches a fat-fingered entry.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 })
    }
    if (!childFirstName) {
      return NextResponse.json({ error: 'اسم الطفل مطلوب' }, { status: 400 })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(Date.parse(birthDate))) {
      return NextResponse.json({ error: 'تاريخ ميلاد الطفل غير صالح' }, { status: 400 })
    }
    if (new Date(birthDate) > new Date()) {
      return NextResponse.json({ error: 'تاريخ الميلاد في المستقبل' }, { status: 400 })
    }

    const existing = await getParentByEmail(email)
    if (existing) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مسجّل مسبقاً لحساب آخر', existingParentId: existing.id },
        { status: 409 },
      )
    }

    // A credential nobody holds. The family reaches the account only through the
    // owner-generated reset link, so there is no password to leak or to share.
    const throwawayPassword = crypto.randomBytes(32).toString('hex')

    const parent = await createParent({
      email,
      passwordHash: hashPassword(throwawayPassword),
      firstName,
      lastName,
      phone: str(parentIn.phone, 30),
      country: str(parentIn.country, 60),
      accountType: 'in-person',
      // Active so the family can sign in, with no expiry so the subscription
      // cron never touches the account (it only expires accounts that have one).
      subscriptionStatus: 'active',
      subscriptionExpiry: null,
      // Meaningless for an in-person family and never displayed to them — every
      // surface checks accountType first. Stored only because the field is
      // required, and 'session' is the smallest, least misleading placeholder.
      subscriptionPlan: 'session',
      // Not verified: the specialist vouches for the address in person, but no
      // one has proven ownership of the inbox, and claiming otherwise would be
      // a lie in the record. Access does not depend on it.
      emailVerified: false,
      childrenIds: [],
      lastLoginAt: null,
      reminderCount: 0,
      lastReminderAt: null,
      notes: str(body.notes, 2000),
    })

    const student = await createStudent({
      parentId: parent.id,
      firstName: childFirstName,
      lastName: str(childIn.lastName, 50) || lastName,
      birthDate,
      ageGroup: ageGroupFromBirthDate(birthDate),
      diagnosis: (VALID_DIAGNOSES.includes(childIn.diagnosis) ? childIn.diagnosis : 'OTHER') as Diagnosis,
      severityLevel: ([1, 2, 3].includes(Number(childIn.severityLevel)) ? Number(childIn.severityLevel) : 1) as 1 | 2 | 3,
      sensoryProfile: {
        visualSensitivity: 'medium',
        audioSensitivity: 'medium',
        touchSensitivity: 'medium',
        preferredActivities: [],
        avoidedActivities: [],
      },
      currentProgramId: null,
      achievements: [],
      totalPoints: 0,
      streak: 0,
      notes: '',
    })

    // The child list on the parent is what the portal reads; a create that
    // stopped here would leave a family whose child is invisible to them.
    try {
      await updateParent(parent.id, { childrenIds: [student.id] })
    } catch (e) {
      console.error('[admin/clients POST] failed to link child to parent', e)
      return NextResponse.json(
        { error: 'أُنشئ الحساب لكن تعذّر ربط الطفل به — افتح ملف العميل وتحقق', parentId: parent.id },
        { status: 500 },
      )
    }

    await audit({
      action: 'client_create',
      actorId: 'admin',
      actorRole: 'admin',
      targetId: parent.id,
      meta: { accountType: 'in-person', studentId: student.id },
    })

    return NextResponse.json({ ok: true, parent: { ...parent, passwordHash: undefined }, student })
  } catch (e) {
    console.error('[admin/clients POST]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
