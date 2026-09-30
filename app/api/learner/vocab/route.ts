import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getLearner } from '@/lib/language-learners'
import { vocabForLevel, FRENCH_VOCAB } from '@/lib/languages/french-vocab'
import { getSrs, gradeCard, dueCards, masteredCount } from '@/lib/languages/srs'
import { awardXp } from '@/lib/languages/progress'
import type { CEFRLevel } from '@/lib/languages/placement-fr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function learnerId(): Promise<string | null> {
  const store = await cookies()
  return (await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value))?.id ?? null
}
const levelOf = (lv: string): CEFRLevel => (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(lv) ? lv as CEFRLevel : 'A1')

// GET: the vocab cards due for review now (level + spaced-repetition schedule).
export async function GET() {
  const id = await learnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const learner = await getLearner(id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

  const map = await getSrs(id)
  const pool = vocabForLevel(levelOf(learner.level))
  const due = dueCards(map, pool, 15)
  return NextResponse.json({ due, mastered: masteredCount(map), total: pool.length })
}

// POST {wordId, correct}: grade a review, update the schedule, award XP.
export async function POST(req: NextRequest) {
  const id = await learnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { wordId, correct } = (await req.json().catch(() => ({}))) as { wordId?: string; correct?: boolean }
  if (!wordId || !FRENCH_VOCAB.some(v => v.id === wordId)) return NextResponse.json({ error: 'بطاقة غير موجودة' }, { status: 404 })

  await gradeCard(id, wordId, !!correct)
  const progress = await awardXp(id, correct ? 5 : 1, { review: true })
  return NextResponse.json({ ok: true, progress })
}
