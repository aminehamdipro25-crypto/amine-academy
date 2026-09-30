import { NextRequest, NextResponse } from 'next/server'
import { getDashboardActorId } from '@/lib/auth'
import { getLearner, updateLearner } from '@/lib/language-learners'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The teacher decides, after a trial, whether to continue with a learner.
// accept → fit:'accepted' ; decline → fit:'declined_teacher' (owner reassigns).
export async function POST(req: NextRequest) {
  const actor = await getDashboardActorId()
  if (!actor) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { learnerId, decision } = (await req.json().catch(() => ({}))) as { learnerId?: string; decision?: string }
  if (!learnerId || !['accept', 'decline'].includes(decision || '')) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

  const learner = await getLearner(learnerId)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  const staffId = actor.startsWith('staff:') ? actor.slice(6) : null
  if (actor !== 'owner' && learner.teacherId !== staffId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  await updateLearner(learnerId, { fit: decision === 'accept' ? 'accepted' : 'declined_teacher' })
  return NextResponse.json({ ok: true })
}
