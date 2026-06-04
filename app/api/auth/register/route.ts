import { NextRequest, NextResponse } from 'next/server'
import { createParent, getParentByEmail, createStudent, updateParent, createActivationCode } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { sendEmail, welcomeParentEmail } from '@/lib/mailer'
import type { AgeGroup, Diagnosis } from '@/lib/types'

export const runtime = 'nodejs'

function calcAgeGroup(birthDate: string): AgeGroup {
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  if (age <= 11) return '5-11'
  if (age <= 17) return '12-17'
  return '18-22'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })

    const { parent, child, plan } = body

    if (!parent?.email?.trim() || !parent?.password || !parent?.firstName?.trim() || !parent?.lastName?.trim()) {
      return NextResponse.json({ error: 'بيانات ولي الأمر غير مكتملة' }, { status: 400 })
    }
    if (parent.password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }
    if (!child?.firstName?.trim() || !child?.birthDate) {
      return NextResponse.json({ error: 'بيانات الطفل غير مكتملة' }, { status: 400 })
    }

    // Check email not already taken
    const existing = await getParentByEmail(parent.email.trim())
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجّل مسبقاً — يمكنك تسجيل الدخول' }, { status: 409 })
    }

    const passwordHash = hashPassword(parent.password)

    const newParent = await createParent({
      email: parent.email.toLowerCase().trim(),
      passwordHash,
      firstName: parent.firstName.trim(),
      lastName: parent.lastName.trim(),
      phone: parent.phone?.trim() || '',
      country: parent.country || '',
      subscriptionStatus: 'pending',
      subscriptionPlan: (['basic', 'standard', 'premium'].includes(plan) ? plan : 'basic') as 'basic' | 'standard' | 'premium',
      subscriptionExpiry: null,
      childrenIds: [],
      lastLoginAt: null,
      reminderCount: 0,
      lastReminderAt: null,
      notes: '',
    })

    const student = await createStudent({
      parentId: newParent.id,
      firstName: child.firstName.trim(),
      lastName: child.lastName?.trim() || newParent.lastName,
      birthDate: child.birthDate,
      ageGroup: calcAgeGroup(child.birthDate),
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

    // Link child to parent
    await updateParent(newParent.id, { childrenIds: [student.id] })

    // Welcome email — non-fatal
    try {
      const code = await createActivationCode(newParent.email)
      await sendEmail({
        to: newParent.email,
        subject: 'مرحباً في أكاديمية أمين 🌟',
        html: welcomeParentEmail(newParent.firstName, code),
      })
    } catch (mailErr) {
      console.warn('[register] email skipped:', (mailErr as Error).message)
    }

    return NextResponse.json({
      ok: true,
      parentId: newParent.id,
      message: 'تم التسجيل بنجاح! سيتواصل معك الأستاذ أمين قريباً.',
    })
  } catch (err) {
    console.error('[register] fatal:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم، يرجى المحاولة مجدداً' }, { status: 500 })
  }
}
