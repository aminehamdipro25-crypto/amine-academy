import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getLearner } from '@/lib/language-learners'
import { appendMessage, getThread, markThreadRead, getUnread } from '@/lib/lang-messages'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { redis } from '@/lib/redis'
import { getStaff } from '@/lib/db'
import { sendEmail } from '@/lib/mailer'
import { tg, tgEsc } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function currentLearnerId(): Promise<string | null> {
  const store = await cookies()
  const payload = await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value)
  return payload?.id ?? null
}

// GET: the learner's thread with their teacher (also clears the learner's unread).
export async function GET() {
  const id = await currentLearnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const learner = await getLearner(id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

  const messages = await getThread(id)
  await markThreadRead(id, 'learner')
  return NextResponse.json({ messages, teacherName: learner.teacherName, hasTeacher: !!learner.teacherId })
}

// POST: learner sends a message to their teacher.
export async function POST(req: NextRequest) {
  const id = await currentLearnerId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const rl = await isRateLimited(`lang_msg:${getClientIp(req)}`, 40, 300)
  if (rl.limited) return NextResponse.json({ error: 'رسائل كثيرة — تمهّل قليلاً' }, { status: 429 })

  const learner = await getLearner(id)
  if (!learner) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  if (!learner.teacherId) return NextResponse.json({ error: 'لم يُعيّن لك أستاذ بعد' }, { status: 400 })

  const { text } = (await req.json().catch(() => ({}))) as { text?: string }
  const clean = String(text || '').trim()
  if (!clean) return NextResponse.json({ error: 'الرسالة فارغة' }, { status: 400 })

  const msg = await appendMessage(id, 'learner', clean)

  // Notify the teacher, debounced to at most once per 30 min per learner.
  try {
    const notifKey = `lang_msg_notif:${id}`
    if (!(await redis.get(notifKey))) {
      await redis.set(notifKey, '1', { ex: 1800 })
      tg(`<b>💬 رسالة جديدة</b>\nمن التلميذ: ${tgEsc(learner.name)}`).catch(() => {})
      const teacher = await getStaff(learner.teacherId)
      if (teacher?.email) {
        sendEmail({
          to: teacher.email, subject: '💬 رسالة جديدة من تلميذك — أمين للّغات',
          text: `${learner.name} أرسل لك رسالة. افتح محادثات المتعلّمين للردّ.`,
          html: `<div style="font-family:system-ui,Arial;direction:rtl;text-align:right"><h2 style="color:#6B46F0">💬 رسالة جديدة</h2><p><b>${learner.name}</b> أرسل لك رسالة.</p><p style="color:#888">افتح «محادثات المتعلّمين» في لوحتك للردّ.</p></div>`,
        }).catch(() => {})
      }
    }
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true, message: msg })
}

// Lightweight unread poll for the learner (badge).
export async function HEAD() {
  const id = await currentLearnerId()
  if (!id) return new NextResponse(null, { status: 401 })
  const n = await getUnread(id, 'learner')
  return new NextResponse(null, { status: 200, headers: { 'x-unread': String(n) } })
}
