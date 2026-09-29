import { NextRequest, NextResponse } from 'next/server'
import { getDashboardActorId } from '@/lib/auth'
import { getLearner, getAllLearners } from '@/lib/language-learners'
import { appendMessage, getThread, markThreadRead, getUnread } from '@/lib/lang-messages'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function staffIdOf(actor: string): string | null {
  return actor.startsWith('staff:') ? actor.slice(6) : null
}
// Can this dashboard actor talk to this learner? Owner: anyone. Teacher: only theirs.
function canAccess(actor: string, learnerTeacherId: string | null): boolean {
  if (actor === 'owner') return true
  return staffIdOf(actor) === learnerTeacherId
}

export async function GET(req: NextRequest) {
  const actor = await getDashboardActorId()
  if (!actor) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const learnerId = req.nextUrl.searchParams.get('learnerId')

  // Thread view for one learner.
  if (learnerId) {
    const learner = await getLearner(learnerId)
    if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    if (!canAccess(actor, learner.teacherId)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    const messages = await getThread(learnerId)
    await markThreadRead(learnerId, 'teacher')
    return NextResponse.json({ learner: { id: learner.id, name: learner.name, level: learner.level, language: learner.language, nextLesson: learner.nextLesson || null }, messages })
  }

  // Conversation list: the learners this actor may chat with, newest activity first.
  const all = await getAllLearners()
  const mine = actor === 'owner' ? all : all.filter(l => l.teacherId === staffIdOf(actor))
  const rows = await Promise.all(mine.map(async l => {
    const [thread, unread] = await Promise.all([getThread(l.id, 1), getUnread(l.id, 'teacher')])
    const last = thread[thread.length - 1]
    return { id: l.id, name: l.name, level: l.level, language: l.language, unread, lastText: last?.text || '', lastAt: last?.createdAt || '' }
  }))
  rows.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1))
  return NextResponse.json({ conversations: rows })
}

export async function POST(req: NextRequest) {
  const actor = await getDashboardActorId()
  if (!actor) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { learnerId, text } = (await req.json().catch(() => ({}))) as { learnerId?: string; text?: string }
  const clean = String(text || '').trim()
  if (!learnerId || !clean) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

  const learner = await getLearner(learnerId)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  if (!canAccess(actor, learner.teacherId)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const msg = await appendMessage(learnerId, 'teacher', clean)
  return NextResponse.json({ ok: true, message: msg })
}
