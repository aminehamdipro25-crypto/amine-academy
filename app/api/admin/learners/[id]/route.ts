import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getStaff } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { getLearner, updateLearner, deleteLearner } from '@/lib/language-learners'
import type { LanguageLearner } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'unknown']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await params
    const learner = await getLearner(id)
    if (!learner) return NextResponse.json({ error: 'المتعلّم غير موجود' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const updates: Partial<LanguageLearner> = {}
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
    if (typeof body.phone === 'string') updates.phone = body.phone.trim()
    if (CEFR.includes(body.level)) updates.level = body.level
    if ('teacherId' in body) {
      const teacherId = body.teacherId ? String(body.teacherId).trim() : null
      if (teacherId) {
        const t = await getStaff(teacherId)
        if (!t) return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 404 })
        updates.teacherId = teacherId; updates.teacherName = t.name
      } else { updates.teacherId = null; updates.teacherName = null }
    }
    if (typeof body.password === 'string' && body.password) {
      if (body.password.length < 6) return NextResponse.json({ error: 'كلمة المرور قصيرة جداً' }, { status: 400 })
      updates.passwordHash = hashPassword(body.password)
    }

    await updateLearner(id, updates)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/learners PATCH]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await params
    await deleteLearner(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[admin/learners DELETE]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
