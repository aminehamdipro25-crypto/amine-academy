import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getLearner } from '@/lib/language-learners'
import { exercisesForLevel, FRENCH_EXERCISES } from '@/lib/languages/french-exercises'
import { getProgress, awardXp } from '@/lib/languages/progress'
import type { CEFRLevel } from '@/lib/languages/placement-fr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function learnerId(): Promise<string | null> {
  const store = await cookies()
  return (await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value))?.id ?? null
}
const levelOf = (lv: string): CEFRLevel => (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(lv) ? lv as CEFRLevel : 'A1')

// GET: exercises for the learner's level (answer key stripped) + their progress.
export async function GET() {
  const id = await learnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const learner = await getLearner(id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

  const list = exercisesForLevel(levelOf(learner.level))
  const progress = await getProgress(id)
  const exercises = list.map(({ answer, explain, ...e }) => ({ ...e, done: progress.doneIds.includes(e.id) }))
  return NextResponse.json({ exercises, level: levelOf(learner.level), progress })
}

// POST {exerciseId, chosen}: grade one answer, award XP, reveal the key.
export async function POST(req: NextRequest) {
  const id = await learnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { exerciseId, chosen } = (await req.json().catch(() => ({}))) as { exerciseId?: string; chosen?: number }
  const ex = FRENCH_EXERCISES.find(e => e.id === exerciseId)
  if (!ex) return NextResponse.json({ error: 'تمرين غير موجود' }, { status: 404 })

  const correct = chosen === ex.answer
  const progress = await awardXp(id, correct ? 10 : 2, { exercise: true, exerciseId: ex.id })
  return NextResponse.json({ correct, answer: ex.answer, explain: ex.explain, progress })
}
