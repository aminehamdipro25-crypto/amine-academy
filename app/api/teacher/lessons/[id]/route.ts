import { NextRequest, NextResponse } from 'next/server'
import { getDashboardActorId } from '@/lib/auth'
import { getTeacherLesson, deleteTeacherLesson } from '@/lib/teacher-lessons'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDashboardActorId()
  const staffId = actor && actor.startsWith('staff:') ? actor.slice(6) : null
  if (!staffId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { id } = await params
  const lesson = await getTeacherLesson(id)
  if (!lesson || lesson.teacherId !== staffId) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  await deleteTeacherLesson(id, staffId)
  return NextResponse.json({ ok: true })
}
