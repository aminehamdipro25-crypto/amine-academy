import { redis } from '@/lib/redis'

// ── Amine Languages — teacher ratings (marketplace trust) ────────────────────
// One rating per learner per teacher (updatable). Keys:
//   rating:<teacherId>:<learnerId> → { stars, comment, learnerName, at }
//   ratings:<teacherId>            → SET of learnerIds

export interface Rating { stars: number; comment: string; learnerName: string; at: string }

const KEY = (t: string, l: string) => `rating:${t}:${l}`
const SET = (t: string) => `ratings:${t}`

export async function setRating(teacherId: string, learnerId: string, learnerName: string, stars: number, comment: string): Promise<void> {
  const rating: Rating = { stars: Math.max(1, Math.min(5, Math.round(stars))), comment: comment.slice(0, 400), learnerName, at: new Date().toISOString() }
  await redis.set(KEY(teacherId, learnerId), rating)
  await redis.sadd(SET(teacherId), learnerId)
}

export async function getTeacherRatings(teacherId: string): Promise<Rating[]> {
  const ids = await redis.smembers(SET(teacherId))
  if (!ids.length) return []
  const rows = await redis.mget<Rating>(ids.map(l => KEY(teacherId, l)))
  return (rows.filter(Boolean) as Rating[]).sort((a, b) => (a.at < b.at ? 1 : -1))
}

export function summarize(ratings: Rating[]): { avg: number; count: number } {
  if (!ratings.length) return { avg: 0, count: 0 }
  const sum = ratings.reduce((s, r) => s + r.stars, 0)
  return { avg: Math.round((sum / ratings.length) * 10) / 10, count: ratings.length }
}
