import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getLearner } from '@/lib/language-learners'
import { setRating } from '@/lib/teacher-ratings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The learner rates their assigned teacher (1–5 stars + optional comment).
export async function POST(req: NextRequest) {
  const store = await cookies()
  const payload = await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value)
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const learner = await getLearner(payload.id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  if (!learner.teacherId) return NextResponse.json({ error: 'لا يوجد أستاذ لتقييمه' }, { status: 400 })

  const { stars, comment } = (await req.json().catch(() => ({}))) as { stars?: number; comment?: string }
  if (!Number.isFinite(Number(stars)) || Number(stars) < 1 || Number(stars) > 5) return NextResponse.json({ error: 'التقييم من 1 إلى 5' }, { status: 400 })

  await setRating(learner.teacherId, learner.id, learner.name, Number(stars), String(comment || '').trim())
  return NextResponse.json({ ok: true })
}
