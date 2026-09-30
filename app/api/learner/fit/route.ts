import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getLearner, updateLearner } from '@/lib/language-learners'
import { tg, tgEsc } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The learner (or parent) decides whether the teacher is a good fit after a trial.
// accept → fit:'accepted' ; decline → fit:'declined_learner' (owner reassigns).
export async function POST(req: NextRequest) {
  const store = await cookies()
  const payload = await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value)
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { decision } = (await req.json().catch(() => ({}))) as { decision?: string }
  if (!['accept', 'decline'].includes(decision || '')) return NextResponse.json({ error: 'قرار غير صالح' }, { status: 400 })

  const learner = await getLearner(payload.id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

  await updateLearner(payload.id, { fit: decision === 'accept' ? 'accepted' : 'declined_learner' })
  if (decision === 'decline') {
    tg(`<b>🔄 طلب تغيير أستاذ</b>\nالتلميذ: ${tgEsc(learner.name)} يطلب أستاذاً آخر.`).catch(() => {})
  }
  return NextResponse.json({ ok: true })
}
