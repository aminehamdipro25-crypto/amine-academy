import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis'

// ── Amine Languages — learner ↔ teacher chat ─────────────────────────────────
// One thread per learner (learner talks to their assigned teacher). Redis keys:
//   lang_thread:<learnerId>          → list of message JSON (LPUSH newest-first)
//   lang_unread:learner:<learnerId>  → count of teacher→learner msgs unread by learner
//   lang_unread:teacher:<learnerId>  → count of learner→teacher msgs unread by teacher

export type Sender = 'learner' | 'teacher'
export interface LangMessage { id: string; sender: Sender; text: string; createdAt: string }

const THREAD = (id: string) => `lang_thread:${id}`
const UNREAD_LEARNER = (id: string) => `lang_unread:learner:${id}`
const UNREAD_TEACHER = (id: string) => `lang_unread:teacher:${id}`

export async function appendMessage(learnerId: string, sender: Sender, text: string): Promise<LangMessage> {
  const msg: LangMessage = { id: `m_${randomUUID()}`, sender, text: text.slice(0, 2000), createdAt: new Date().toISOString() }
  await redis.lpush(THREAD(learnerId), JSON.stringify(msg))
  // Bump the OTHER party's unread counter.
  await redis.incr(sender === 'learner' ? UNREAD_TEACHER(learnerId) : UNREAD_LEARNER(learnerId))
  return msg
}

export async function getThread(learnerId: string, limit = 200): Promise<LangMessage[]> {
  const raw = await redis.lrange(THREAD(learnerId), 0, limit - 1)
  const msgs: LangMessage[] = []
  for (const r of raw) {
    try { msgs.push(typeof r === 'string' ? JSON.parse(r) : (r as LangMessage)) } catch { /* skip */ }
  }
  return msgs.reverse() // oldest first for display
}

export async function markThreadRead(learnerId: string, who: Sender): Promise<void> {
  await redis.del(who === 'learner' ? UNREAD_LEARNER(learnerId) : UNREAD_TEACHER(learnerId))
}

export async function getUnread(learnerId: string, who: Sender): Promise<number> {
  const v = await redis.get<number | string>(who === 'learner' ? UNREAD_LEARNER(learnerId) : UNREAD_TEACHER(learnerId))
  return Number(v) || 0
}
