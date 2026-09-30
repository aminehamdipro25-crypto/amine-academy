import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getLearner } from '@/lib/language-learners'
import { comprehensionFor, FRENCH_COMPREHENSION } from '@/lib/languages/french-comprehension'
import { awardXp } from '@/lib/languages/progress'
import type { CEFRLevel } from '@/lib/languages/placement-fr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function learnerId(): Promise<string | null> {
  const store = await cookies()
  return (await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value))?.id ?? null
}
const levelOf = (lv: string): CEFRLevel => (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(lv) ? lv as CEFRLevel : 'A1')

// GET ?type=listening|reading → items for the learner's level (answer key stripped).
export async function GET(req: NextRequest) {
  const id = await learnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const learner = await getLearner(id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  const type = req.nextUrl.searchParams.get('type') === 'reading' ? 'reading' : 'listening'
  const items = comprehensionFor(levelOf(learner.level), type).map(({ answer, explain, ...i }) => i)
  return NextResponse.json({ items, level: levelOf(learner.level), type })
}

// POST {itemId, chosen} → grade, award XP, reveal key.
export async function POST(req: NextRequest) {
  const id = await learnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { itemId, chosen } = (await req.json().catch(() => ({}))) as { itemId?: string; chosen?: number }
  const item = FRENCH_COMPREHENSION.find(i => i.id === itemId)
  if (!item) return NextResponse.json({ error: 'عنصر غير موجود' }, { status: 404 })
  const correct = chosen === item.answer
  const progress = await awardXp(id, correct ? 10 : 2, { exercise: true, exerciseId: item.id })
  return NextResponse.json({ correct, answer: item.answer, explain: item.explain, progress })
}
