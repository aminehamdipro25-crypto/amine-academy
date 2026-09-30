import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getAllLearners } from '@/lib/language-learners'
import { redis } from '@/lib/redis'
import { weekBucket, wxpKeyFor } from '@/lib/languages/progress'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Weekly XP leaderboard among all learners. First names only (privacy).
export async function GET() {
  const store = await cookies()
  const payload = await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value)
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const learners = await getAllLearners()
  if (!learners.length) return NextResponse.json({ rows: [], me: null })

  const bucket = weekBucket()
  const xps = await redis.mget<number | string>(learners.map(l => wxpKeyFor(l.id, bucket)))
  const rows = learners.map((l, i) => ({
    id: l.id,
    name: (l.name || '').split(' ')[0] || l.name,
    xp: Number(xps[i]) || 0,
  })).sort((a, b) => b.xp - a.xp)

  const ranked = rows.map((r, i) => ({ ...r, rank: i + 1, isMe: r.id === payload.id }))
  const me = ranked.find(r => r.isMe) || null
  // Expose ids only for "isMe"; strip ids otherwise.
  const top = ranked.slice(0, 20).map(({ id, ...r }) => r)
  return NextResponse.json({ rows: top, me: me ? { rank: me.rank, xp: me.xp } : null })
}
