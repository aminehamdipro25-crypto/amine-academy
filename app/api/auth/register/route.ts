import { NextRequest, NextResponse } from 'next/server'
import { createParent, getParentByEmail, createStudent, updateParent, createActivationCode, createAppointment } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { sendEmail, welcomeParentEmail } from '@/lib/mailer'
import { tg, tgEsc } from '@/lib/telegram'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { verifyRecaptcha } from '@/lib/recaptcha'
import type { AgeGroup, Diagnosis } from '@/lib/types'

export const runtime = 'nodejs'

const VALID_DIAGNOSES: Diagnosis[] = ['ADHD', 'AUTISM', 'ADHD+AUTISM', 'OTHER']

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

    // Keyless bot protection (captcha-equivalent, no third-party service):
    //  1) Honeypot — a hidden field only bots fill. If present, reject.
    //  2) Submit timing — a human takes seconds to fill 3 steps; a sub-2.5s
    //     submit is automated. Only enforced when the client sent a timestamp,
    //     so a stale cached client is never wrongly blocked.
    if (typeof body.hp === 'string' && body.hp.trim() !== '') {
      return NextResponse.json({ error: 'تعذّر إتمام التسجيل، حاول مجدداً' }, { status: 400 })
    }
    const loadedAt = Number(body.formLoadedAt)
    if (Number.isFinite(loadedAt) && loadedAt > 0 && Date.now() - loadedAt < 2500) {
      return NextResponse.json({ error: 'يرجى إعادة المحاولة بعد لحظات' }, { status: 400 })
    }
    //  3) reCAPTCHA v3 — only enforced when the server key is configured;
    //     otherwise skipped (honeypot + timing remain the active defense).
    const captcha = await verifyRecaptcha(body.recaptchaToken, 'register')
    if (!captcha.ok) {
      return NextResponse.json({ error: 'تعذّر التحقق من أنك لست روبوتاً، يرجى المحاولة مجدداً' }, { status: 400 })
    }

    const { parent, child, plan, assessment } = body

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
      emailVerified: false,
      // Store the plan the parent actually chose. The pricing UI uses the
      // session/weekly/monthly vocabulary (basic/standard/premium are the legacy
      // aliases); both are valid Parent plans. The old check only accepted the
      // legacy set, so every registrant was silently saved as 'basic'.
      subscriptionPlan: (['basic', 'standard', 'premium', 'session', 'weekly', 'monthly'].includes(plan) ? plan : 'weekly') as 'basic' | 'standard' | 'premium' | 'session' | 'weekly' | 'monthly',
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
      // Runtime-validated against the actual Diagnosis union — this is public,
      // unauthenticated registration input that later flows unescaped into
      // AI-generated program/report prompts and email templates, so it must
      // never be allowed to carry arbitrary attacker-supplied text.
      diagnosis: (VALID_DIAGNOSES.includes(child.diagnosis) ? child.diagnosis : 'OTHER') as Diagnosis,
      severityLevel: ([1, 2, 3].includes(Number(child.severityLevel)) ? Number(child.severityLevel) : 1) as 1 | 2 | 3,
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

    // Free assessment booking — when the parent came through the "free
    // assessment session" flow they pick a preferred date/time instead of paying.
    // Create it as an intake appointment the specialist confirms. A taken slot
    // (or any Redis hiccup) must NOT fail the whole registration — the account
    // is already created; the specialist can schedule manually.
    step = 'assessment'
    let assessmentBooked = false
    if (assessment?.date && assessment?.timeSlot) {
      try {
        await createAppointment({
          parentId: newParent.id,
          studentId: student.id,
          date: String(assessment.date),
          timeSlot: String(assessment.timeSlot),
          type: 'assessment',
          isFreeIntake: true,
          status: 'scheduled',
          meetingUrl: '',
          notes: 'جلسة تقييمية مجانية — أول لقاء تعريفي وتقييم (قبل الاشتراك)',
        })
        assessmentBooked = true
      } catch (apptErr) {
        console.warn('[register] free assessment not booked:', (apptErr as Error).message)
      }
    }

    // Telegram notification (non-blocking)
    tg(
      `🆕 <b>${assessment ? 'حجز جلسة تقييمية مجانية!' : 'تسجيل جديد!'}</b>\n\n` +
      `👤 ${tgEsc(newParent.firstName)} ${tgEsc(newParent.lastName)}\n` +
      `📧 ${tgEsc(newParent.email)}\n` +
      `📱 ${tgEsc(newParent.phone || 'لم يُذكر')}\n` +
      `🧒 الطفل: ${tgEsc(student.firstName)} ${tgEsc(student.lastName)}\n` +
      `🏷 التشخيص: ${tgEsc(student.diagnosis)} | العمر: ${tgEsc(student.ageGroup)}\n` +
      (assessment
        ? `🎁 تقييم مجاني${assessmentBooked ? `: ${tgEsc(String(assessment.date))} ${tgEsc(String(assessment.timeSlot))}` : ' — يحتاج جدولة يدوية (الوقت المطلوب محجوز)'}\n`
        : `📦 الخطة: ${tgEsc(newParent.subscriptionPlan)}\n`) +
      `🕐 ${new Date().toLocaleString('fr-FR', { timeZone: 'Asia/Qatar' })}`
    ).catch(() => {})

    return NextResponse.json({ ok: true, parentId: newParent.id, assessment: !!assessment, booked: assessmentBooked })
  } catch (err) {
    const msg = (err as Error).message || String(err)
    console.error(`[register] failed at step="${step}":`, msg)
    return NextResponse.json({ error: 'حدث خطأ في الخادم، حاول مجدداً' }, { status: 500 })
  }
}
