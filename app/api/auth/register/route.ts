import { NextRequest, NextResponse } from 'next/server'
import { createParent, getParentByEmail, createStudent, updateParent, createActivationCode } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { sendEmail, welcomeParentEmail } from '@/lib/mailer'
import { tg, tgEsc } from '@/lib/telegram'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import type { AgeGroup, Diagnosis } from '@/lib/types'

export const runtime = 'nodejs'

function calcAgeGroup(birthDate: string): AgeGroup {
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  if (age <= 11) return '5-11'
  if (age <= 17) return '12-17'
  return '18-22'
}

export async function POST(req: NextRequest) {
  let step = 'parse'
  try {
    const ip = getClientIp(req)
    const rl = await isRateLimited(`register:${ip}`, 10, 3600)
    if (rl.limited) {
      return rl.unavailable
        ? NextResponse.json({ error: 'الخدمة غير متوفرة مؤقتًا، يرجى المحاولة بعد قليل' }, { status: 503 })
        : NextResponse.json({ error: 'حاول مجدداً بعد ساعة' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    const { parent, child, plan } = body

    step = 'validate'
    if (!parent?.email?.trim() || !parent?.password || !parent?.firstName?.trim() || !parent?.lastName?.trim())
      return NextResponse.json({ error: 'بيانات ولي الأمر غير مكتملة' }, { status: 400 })
    if (parent.password.length < 6)
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    if (!child?.firstName?.trim() || !child?.birthDate)
      return NextResponse.json({ error: 'بيانات الطفل غير مكتملة' }, { status: 400 })

    step = 'check-email'
    const existing = await getParentByEmail(parent.email.trim())
    if (existing)
      return NextResponse.json({ error: 'البريد الإلكتروني مسجّل مسبقاً — يمكنك تسجيل الدخول' }, { status: 409 })

    step = 'hash-password'
    const passwordHash = hashPassword(parent.password)

    step = 'create-parent'
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

    step = 'create-student'
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

    step = 'link-child'
    await updateParent(newParent.id, { childrenIds: [student.id] })

    step = 'email'
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

    // Telegram notification (non-blocking)
    tg(
      `🆕 <b>تسجيل جديد!</b>\n\n` +
      `👤 ${tgEsc(newParent.firstName)} ${tgEsc(newParent.lastName)}\n` +
      `📧 ${tgEsc(newParent.email)}\n` +
      `📱 ${tgEsc(newParent.phone || 'لم يُذكر')}\n` +
      `🧒 الطفل: ${tgEsc(student.firstName)} ${tgEsc(student.lastName)}\n` +
      `🏷 التشخيص: ${tgEsc(student.diagnosis)} | العمر: ${tgEsc(student.ageGroup)}\n` +
      `📦 الخطة: ${tgEsc(newParent.subscriptionPlan)}\n` +
      `🕐 ${new Date().toLocaleString('fr-FR', { timeZone: 'Asia/Qatar' })}`
    ).catch(() => {})

    return NextResponse.json({ ok: true, parentId: newParent.id })
  } catch (err) {
    const msg = (err as Error).message || String(err)
    console.error(`[register] failed at step="${step}":`, msg)
    return NextResponse.json({ error: 'حدث خطأ في الخادم، حاول مجدداً' }, { status: 500 })
  }
}
