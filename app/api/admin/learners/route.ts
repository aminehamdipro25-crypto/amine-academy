import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser, getDashboardActorId } from '@/lib/auth'
import { getStaff } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { createLearner, getAllLearners, getLearnerByEmail } from '@/lib/language-learners'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'unknown']
const LANGS = ['french', 'english', 'arabic', 'spanish', 'german', 'italian']

// Owner sees all learners; a teacher sees only the learners assigned to them.
export async function GET() {
  const actor = await getDashboardActorId()
  if (!actor) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const all = (await getAllLearners()).map(({ passwordHash, ...l }) => l)
    if (actor === 'owner') return NextResponse.json(all)
    const sid = actor.startsWith('staff:') ? actor.slice(6) : null
    return NextResponse.json(all.filter(l => l.teacherId === sid))
  } catch (e) {
    console.error('[admin/learners GET]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// Creating a learner account (and assigning a teacher) is the owner's decision.
export async function POST(req: NextRequest) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const name  = String(body.name || '').trim().slice(0, 120)
    const email = String(body.email || '').trim().toLowerCase().slice(0, 254)
    const phone = String(body.phone || '').trim().slice(0, 40)
    const password = String(body.password || '')
    const language = LANGS.includes(body.language) ? body.language : 'french'
    const level = CEFR.includes(body.level) ? body.level : 'unknown'
    const teacherId = body.teacherId ? String(body.teacherId).trim() : null

    if (!name || !email || !password) return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' }, { status: 400 })
    if (!email.includes('@')) return NextResponse.json({ error: 'البريد غير صالح' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' }, { status: 400 })
    if (await getLearnerByEmail(email)) return NextResponse.json({ error: 'البريد مستخدم بالفعل' }, { status: 409 })

    let teacherName: string | null = null
    if (teacherId) {
      const t = await getStaff(teacherId)
      if (!t) return NextResponse.json({ error: 'الأستاذ غير موجود' }, { status: 404 })
      teacherName = t.name
    }

    const learner = await createLearner({
      name, email, phone, passwordHash: hashPassword(password),
      language, level, teacherId, teacherName,
    })
    const { passwordHash, ...safe } = learner
    return NextResponse.json(safe, { status: 201 })
  } catch (e) {
    console.error('[admin/learners POST]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
