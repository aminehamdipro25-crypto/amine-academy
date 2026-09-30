import { redis } from '@/lib/redis'
import type { VocabCard } from './french-vocab'

// ── Spaced repetition (Leitner boxes 1–5) ────────────────────────────────────
// Per-learner map of wordId → { box, due }. A correct answer promotes the card
// (longer interval); a wrong answer resets it to box 1 (review immediately).
// Redis key: learner_srs:<learnerId>

export interface SrsCard { box: number; due: string }
const KEY = (id: string) => `learner_srs:${id}`
const INTERVALS = [1, 2, 4, 8, 16] // days for box 1..5

const dayStr = (offset = 0) => {
  const d = new Date(); d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

export async function getSrs(id: string): Promise<Record<string, SrsCard>> {
  return (await redis.get<Record<string, SrsCard>>(KEY(id))) || {}
}

export async function gradeCard(id: string, wordId: string, correct: boolean): Promise<void> {
  const map = await getSrs(id)
  const cur = map[wordId] || { box: 0, due: '' }
  const box = correct ? Math.min(5, cur.box + 1) : 1
  const due = correct ? dayStr(INTERVALS[box - 1]) : dayStr(0)
  map[wordId] = { box, due }
  await redis.set(KEY(id), map)
}

// Cards to review now: never-seen (new) or whose due date has arrived.
export function dueCards(map: Record<string, SrsCard>, all: VocabCard[], limit = 15) {
  const today = dayStr()
  const out: (VocabCard & { isNew: boolean })[] = []
  for (const w of all) {
    const c = map[w.id]
    if (!c) out.push({ ...w, isNew: true })
    else if (c.due <= today) out.push({ ...w, isNew: false })
    if (out.length >= limit) break
  }
  return out
}

export function masteredCount(map: Record<string, SrsCard>): number {
  return Object.values(map).filter(c => c.box >= 5).length
}
