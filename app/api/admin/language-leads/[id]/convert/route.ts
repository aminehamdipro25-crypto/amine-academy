import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { isOwnerUser } from '@/lib/auth'
import { getStaff } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { getLanguageLead, markLeadConverted } from '@/lib/language-leads'
import { createLearner, getLearnerByEmail } from '@/lib/language-learners'
import { sendEmail } from '@/lib/mailer'
import { baseUrl } from '@/lib/base-url'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Owner converts an interest lead into a full learner account (assigns a teacher,
// generates a first password, emails the login details). Returns the temporary
// password once so the owner can also share it over WhatsApp.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await params
    const lead = await getLanguageLead(id)
    if (!lead) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    if (!lead.email || !lead.email.includes('@')) return NextResponse.json({ error: 'هذا الطلب بلا بريد صالح — أنشئ الحساب يدوياً' }, { status: 400 })
    if (await getLearnerByEmail(lead.email)) return NextResponse.json({ error: 'يوجد متعلّم بهذا البريد بالفعل' }, { status: 409 })

    const body = await req.json().catch(() => ({}))
    const teacherId = body.teacherId ? String(body.teacherId).trim() : null
    let teacherName: string | null = null
    if (teacherId) {
      const t = await getStaff(teacherId)
      if (!t) return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 404 })
      teacherName = t.name
    }

    // Human-friendly temporary password.
    const tempPassword = 'AL' + crypto.randomBytes(3).toString('hex')

    const learner = await createLearner({
      name: lead.name, email: lead.email, phone: lead.phone,
      passwordHash: hashPassword(tempPassword),
      language: lead.language || 'french',
      level: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(lead.level) ? lead.level : 'unknown',
      teacherId, teacherName,
    })
    await markLeadConverted(id)

    // Welcome email (best-effort).
    const url = `${baseUrl()}/learn/login`
    sendEmail({
      to: lead.email,
      subject: 'مرحباً بك في أمين للّغات 🗣️',
      text: `مرحباً ${lead.name}،\nتم إنشاء حسابك في أمين للّغات.\nالدخول: ${url}\nالبريد: ${lead.email}\nكلمة المرور المؤقتة: ${tempPassword}\nننصحك بتغييرها بعد الدخول.`,
      html: `<div style="font-family:system-ui,Arial;direction:rtl;text-align:right">
        <h2 style="color:#6B46F0">مرحباً بك في أمين للّغات 🗣️</h2>
        <p>مرحباً ${lead.name}، تم إنشاء حسابك.</p>
        <p><b>الدخول:</b> <a href="${url}">${url}</a></p>
        <p><b>البريد:</b> ${lead.email}</p>
        <p><b>كلمة المرور المؤقتة:</b> <code style="background:#f1f0fb;padding:2px 6px;border-radius:4px">${tempPassword}</code></p>
        <p style="color:#888">ننصحك بتغييرها بعد أول دخول.</p>
      </div>`,
    }).catch(() => {})

    const { passwordHash, ...safe } = learner
    return NextResponse.json({ ok: true, learner: safe, tempPassword })
  } catch (e) {
    console.error('[language-leads convert]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
