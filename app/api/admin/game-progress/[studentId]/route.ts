import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getStudentGameHistory, getStudentGameResults } from '@/lib/db'
import type { GameResult } from '@/lib/types'

export const runtime = 'nodejs'

function avg(nums: number[]): number {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0
}

// Real, data-grounded stats for a report period [from, to], plus the previous
// equal-length window so a report can state MEASURABLE improvement instead of
// hand-typed guesses. All computed from the child's actual saved GameResults.
function computePeriodStats(results: GameResult[], from: string, to: string) {
  const fromT = new Date(from).getTime()
  const toT = new Date(to).getTime() + 24 * 3600 * 1000 - 1 // include the whole end day
  if (!Number.isFinite(fromT) || !Number.isFinite(toT) || toT <= fromT) return null
  const len = toT - fromT

  const inWindow = (r: GameResult, lo: number, hi: number) => {
    const t = new Date(r.playedAt).getTime()
    return t >= lo && t <= hi
  }
  const cur = results.filter(r => inWindow(r, fromT, toT))
  const prev = results.filter(r => inWindow(r, fromT - len, fromT - 1))

  const curScore = avg(cur.map(r => r.score))
  const curAcc = avg(cur.map(r => r.accuracy))
  const prevScore = avg(prev.map(r => r.score))
  const prevAcc = avg(prev.map(r => r.accuracy))
  const hasPrev = prev.length > 0

  return {
    count: cur.length,
    avgScore: curScore,
    avgAccuracy: curAcc,
    totalMinutes: Math.round(cur.reduce((s, r) => s + r.durationSeconds, 0) / 60),
    hasPrev,
    prevCount: prev.length,
    prevAvgScore: hasPrev ? prevScore : null,
    prevAvgAccuracy: hasPrev ? prevAcc : null,
    scoreDelta: hasPrev ? curScore - prevScore : null,
    accuracyDelta: hasPrev ? curAcc - prevAcc : null,
  }
}

export async function GET(req: NextRequest, props: { params: Promise<{ studentId: string }> }) {
  const params = await props.params;
  if (!(await isDashboardUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const wantPeriod = !!(from && to)

    const [history, recentResults, allForPeriod] = await Promise.all([
      getStudentGameHistory(params.studentId),
      getStudentGameResults(params.studentId, 20),
      wantPeriod ? getStudentGameResults(params.studentId, 500) : Promise.resolve<GameResult[] | null>(null),
    ])

    const periodStats = wantPeriod && allForPeriod ? computePeriodStats(allForPeriod, from!, to!) : null

    return NextResponse.json({ history, recentResults, periodStats })
  } catch (err) {
    console.error('[admin game-progress GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
