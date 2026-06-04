import { NextRequest, NextResponse } from 'next/server'
import { createParent, getParentByEmail, createStudent, createActivationCode } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { sendEmail, welcomeParentEmail } from '@/lib/mailer'
import type { AgeGroup, Diagnosis } from '@/lib/types'

export const runtime = 'nodejs'

function calcAgeGroup(birthDate: string): AgeGroup {
  const dob = new Date(birthDate)
  const ageMs = Date.now() - dob.getTime()
  const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25))
  if (age <= 11) return '5-11'
  if (age <= 17) return '12-17'
  return '18-22'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { parent, child, plan } = body ?? {}

    // ── Validate parent fields ──────────────────────────────────
    if (!parent?.email?.trim() || !parent?.password || !parent?.firstName?.trim() || !parent?.lastName?.trim()) {
      return NextResponse.json({ error: 'بيانات ولي الأمر غير مكتملة' }, { status: 400 })
    }
    if (parent.password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    // ── Validate child fields ───────────────────────────────────
    if (!child?.firstName?.trim() || !child?.birthDate) {
      return NextResponse.json({ error: 'بيانات الطفل غير مكتملة' }, { status: 400 })
    }

    // ── Check email uniqueness ──────────────────────────────────
    const existing = await getParentByEmail(parent.email.trim())
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجّل مسبقاً' }, { status: 409 })
    }

    // ── Create parent ───────────────────────────────────────────
    const passwordHash = hashPassword(parent.password)
    const newParent = await createParent({
      email: parent.email.toLowerCase().trim(),
      passwordHash,
      firstName: parent.firstName.trim(),
      lastName: parent.lastName.trim(),
      phone: parent.phone?.trim() || '',
      country: parent.country || '',
      subscriptionStatus: 'pending',
      subscriptionPlan: (plan as 'basic' | 'standard' | 'premium') || 'basic',
      subscriptionExpiry: null,
      childrenIds: [],
      lastLoginAt: null,
      reminderCount: 0,
      lastReminderAt: null,
      notes: '',
    })

    // ── Create student (child) ─────────────────────────────────
    const ageGroup = calcAgeGroup(child.birthDate)
    const student = await createStudent({
      parentId: newParent.id,
      firstName: child.firstName.trim(),
      lastName: (child.lastName?.trim()) || newParent.lastName,
      birthDate: child.birthDate,
      ageGroup,
      diagnosis: (child.diagnosis as Diagnosis) || 'ADHD',
      severityLevel: (child.severityLevel as 1 | 2 | 3) || 1,
      sensoryProfile: {
        visualSensitivity: child.visualSensitivity || 'medium',
        audioSensitivity: child.audioSensitivity || 'medium',
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

    // Update parent's childrenIds
    await import('@/lib/db').then(({ updateParent }) =>
      updateParent(newParent.id, { childrenIds: [student.id] })
    )

    // ── Send welcome email (non-fatal) ─────────────────────────
    try {
      const code = await createActivationCode(newParent.email)
      await sendEmail({
        to: newParent.email,
        subject: 'مرحباً في أكاديمية أمين 🌟',
        html: welcomeParentEmail(newParent.firstName, code),
      })
    } catch (e) {
      console.warn('[register] email failed (non-fatal):', (e as Error).message)
    }

    return NextResponse.json({
      ok: true,
      parentId: newParent.id,
      message: 'تم التسجيل بنجاح! سيتواصل معك الأستاذ أمين قريباً لتفعيل اشتراكك.',
    })
  } catch (e) {
    console.error('[register]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم، يرجى المحاولة مجدداً' }, { status: 500 })
  }
}
