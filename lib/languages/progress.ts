import { redis } from '@/lib/redis'

// ── Amine Languages — learner progress & gamification ────────────────────────
// One record per learner: XP, daily streak, and counters. Drives the progress
// card, streaks and badges. Redis key: learner_progress:<learnerId>

export interface LearnerProgress {
  xp: number
  streak: number
  lastActive: string      // YYYY-MM-DD of last activity (drives the streak)
  exercisesDone: number
  reviewsDone: number
  doneIds: string[]       // exercise ids already completed (for progress %)
}

const KEY = (id: string) => `learner_progress:${id}`
const empty = (): LearnerProgress => ({ xp: 0, streak: 0, lastActive: '', exercisesDone: 0, reviewsDone: 0, doneIds: [] })

const dayStr = (offset = 0) => {
  const d = new Date(); d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

export async function getProgress(id: string): Promise<LearnerProgress> {
  return (await redis.get<LearnerProgress>(KEY(id))) || empty()
}

// Update the streak for "activity today": +1 if yesterday was active, reset to 1
// if a day was missed, unchanged if already counted today.
function touchStreak(p: LearnerProgress) {
  const today = dayStr()
  if (p.lastActive === today) return
  p.streak = p.lastActive === dayStr(-1) ? p.streak + 1 : 1
  p.lastActive = today
}

export async function awardXp(
  id: string, amount: number, opts: { exercise?: boolean; review?: boolean; exerciseId?: string } = {},
): Promise<LearnerProgress> {
  const p = await getProgress(id)
  touchStreak(p)
  p.xp += Math.max(0, amount)
  if (opts.exercise) p.exercisesDone++
  if (opts.review) p.reviewsDone++
  if (opts.exerciseId && !p.doneIds.includes(opts.exerciseId)) p.doneIds.push(opts.exerciseId)
  await redis.set(KEY(id), p)
  return p
}
