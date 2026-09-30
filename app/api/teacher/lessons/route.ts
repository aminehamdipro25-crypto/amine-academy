import { NextRequest, NextResponse } from 'next/server'
import { getDashboardActorId } from '@/lib/auth'
import { createTeacherLesson, getTeacherLessons } from '@/lib/teacher-lessons'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function staffId(): Promise<string | null> {
  const actor = await getDashboardActorId()
  return actor && actor.startsWith('staff:') ? actor.slice(6) : null
}

export async function GET() {
  const id = await staffId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  return NextResponse.json({ lessons: await getTeacherLessons(id) })
}

export async function POST(req: NextRequest) {
  const id = await staffId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const title = String(body.title || '').trim().slice(0, 160)
  if (!title) return NextResponse.json({ error: 'العنوان مطلوب' }, { status: 400 })
  const lesson = await createTeacherLesson({
    teacherId: id, title,
    level: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'all'].includes(body.level) ? body.level : 'all',
    content: String(body.content || '').trim().slice(0, 4000),
    resources: String(body.resources || '').trim().slice(0, 2000),
  })
  return NextResponse.json({ ok: true, lesson })
}
