import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getTeachingSession, updateTeachingSession, deleteTeachingSession } from '@/lib/teaching-sessions'
import type { TeachingSession } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await params
    const existing = await getTeachingSession(id)
    if (!existing) return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const updates: Partial<TeachingSession> = {}
    if (['scheduled', 'completed', 'paid'].includes(body.status)) updates.status = body.status
    if (body.price !== undefined && body.price !== '' && Number.isFinite(Number(body.price)) && Number(body.price) >= 0) {
      updates.price = Math.round(Number(body.price))
    }
    if (body.teacherSharePct !== undefined && body.teacherSharePct !== '' && Number.isFinite(Number(body.teacherSharePct))) {
      updates.teacherSharePct = Math.min(100, Math.max(0, Number(body.teacherSharePct)))
    }
    if (typeof body.note === 'string') updates.note = body.note.trim().slice(0, 400)

    await updateTeachingSession(id, updates)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[teaching-sessions PATCH]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await params
    await deleteTeachingSession(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[teaching-sessions DELETE]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
