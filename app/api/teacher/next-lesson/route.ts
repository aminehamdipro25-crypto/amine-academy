import { NextRequest, NextResponse } from 'next/server'
import { getDashboardActorId } from '@/lib/auth'
import { getLearner, updateLearner } from '@/lib/language-learners'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The teacher schedules the next live lesson for a learner (date/time + the
// external meeting link they'll run it on — Google Meet, Zoom, …). Owner may
// set it for anyone; a teacher only for their own learners. Empty link clears it.
export async function POST(req: NextRequest) {
  const actor = await getDashboardActorId()
  if (!actor) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { learnerId, at, link, note } = (await req.json().catch(() => ({}))) as
    { learnerId?: string; at?: string; link?: string; note?: string }
  if (!learnerId) return NextResponse.json({ error: 'المتعلّم مطلوب' }, { status: 400 })

  const learner = await getLearner(learnerId)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  const staffId = actor.startsWith('staff:') ? actor.slice(6) : null
  if (actor !== 'owner' && learner.teacherId !== staffId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const cleanLink = String(link || '').trim()
  // Clear the schedule when no link is provided.
  if (!cleanLink) {
    await updateLearner(learnerId, { nextLesson: null })
    return NextResponse.json({ ok: true, cleared: true })
  }
  if (!/^https?:\/\//i.test(cleanLink)) return NextResponse.json({ error: 'الرابط يجب أن يبدأ بـ http' }, { status: 400 })

  await updateLearner(learnerId, {
    nextLesson: { at: String(at || '').slice(0, 40), link: cleanLink.slice(0, 500), note: String(note || '').trim().slice(0, 200) },
  })
  return NextResponse.json({ ok: true })
}
