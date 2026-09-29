import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis'
import type { LanguageLearner } from '@/lib/types'

// ── Amine Languages — learner accounts (Phase 5) ─────────────────────────────
// Redis keys:
//   language_learner:<id>            → LanguageLearner JSON
//   language_learner:email:<email>   → id (login lookup)
//   language_learners:index          → [id]

const KEY = (id: string) => `language_learner:${id}`
const EMAIL = (e: string) => `language_learner:email:${e.toLowerCase()}`
const INDEX = 'language_learners:index'

export type NewLearner = Omit<LanguageLearner, 'id' | 'createdAt' | 'lastLoginAt'>

export async function createLearner(data: NewLearner): Promise<LanguageLearner> {
  const learner: LanguageLearner = {
    ...data,
    email: data.email.toLowerCase(),
    id: `ln_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  }
  await redis.pipeline([
    ['SET', KEY(learner.id), JSON.stringify(learner)],
    ['LPUSH', INDEX, learner.id],
    ['SET', EMAIL(learner.email), learner.id, 'NX'],
  ])
  return learner
}

export async function getLearner(id: string): Promise<LanguageLearner | null> {
  return redis.get<LanguageLearner>(KEY(id))
}

export async function getLearnerByEmail(email: string): Promise<LanguageLearner | null> {
  const id = await redis.get<string>(EMAIL(email))
  if (!id) return null
  return getLearner(id)
}

export async function getAllLearners(): Promise<LanguageLearner[]> {
  const ids = await redis.lrange(INDEX, 0, -1)
  if (!ids.length) return []
  const rows = await redis.mget<LanguageLearner>(ids.map(KEY))
  return (rows.filter(Boolean) as LanguageLearner[]).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function updateLearner(id: string, updates: Partial<LanguageLearner>): Promise<void> {
  const current = await getLearner(id)
  if (!current) throw new Error('Learner not found')
  // Email is the login key; keep it immutable here to avoid orphaning the index.
  const { email: _ignore, ...safe } = updates
  await redis.set(KEY(id), { ...current, ...safe })
}

export async function deleteLearner(id: string): Promise<void> {
  const l = await getLearner(id)
  if (!l) return
  await redis.pipeline([
    ['DEL', KEY(id)],
    ['DEL', EMAIL(l.email)],
    ['LREM', INDEX, '0', id],
  ])
}
