import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getLearner } from '@/lib/language-learners'
import { getAllTeachingSessions } from '@/lib/teaching-sessions'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getProgress } from '@/lib/languages/progress'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const store = await cookies()
  const payload = await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value)
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const learner = await getLearner(payload.id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

  const { passwordHash, ...safe } = learner
  const all = await getAllTeachingSessions()
  const sessions = all
    .filter(s => s.learnerId === learner.id)
    .map(({ price, teacherEarn, academyEarn, teacherSharePct, createdBy, ...s }) => s) // hide accounting from the learner

  const progress = await getProgress(learner.id)
  return NextResponse.json({ learner: safe, sessions, progress })
}
