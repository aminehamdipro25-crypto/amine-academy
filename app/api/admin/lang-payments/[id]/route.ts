import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getLangPayment, updateLangPayment } from '@/lib/lang-payments'
import { getLearner, updateLearner } from '@/lib/language-learners'
import { sendEmail } from '@/lib/mailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PATCH { action:'confirm'|'reject' } — confirming grants the prepaid credits.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { id } = await params
  const pay = await getLangPayment(id)
  if (!pay) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  const { action } = (await req.json().catch(() => ({}))) as { action?: string }

  if (action === 'reject') {
    await updateLangPayment(id, { status: 'rejected' })
    return NextResponse.json({ ok: true })
  }
  if (action === 'confirm') {
    if (pay.status === 'confirmed') return NextResponse.json({ ok: true, already: true })
    await updateLangPayment(id, { status: 'confirmed' })
    const learner = await getLearner(pay.learnerId)
    if (learner) {
      await updateLearner(pay.learnerId, { sessionCredits: (learner.sessionCredits || 0) + pay.sessions })
      if (learner.email) {
        sendEmail({ to: learner.email, subject: 'تم تأكيد باقتك — أمين للّغات 🎉', text: `تم تأكيد ${pay.packageName}. أُضيفت ${pay.sessions} حصص إلى رصيدك.`, html: `<div style="font-family:system-ui;direction:rtl;text-align:right"><h3 style="color:#6B46F0">تم تأكيد باقتك 🎉</h3><p>${pay.packageName} — أُضيفت <b>${pay.sessions}</b> حصص إلى رصيدك.</p></div>` }).catch(() => {})
      }
    }
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
}
