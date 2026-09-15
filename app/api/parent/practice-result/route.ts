import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent, saveGameResult } from '@/lib/db'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { z } from 'zod'

export const runtime = 'nodejs'

/**
 * Records one exercise a child completed at home.
 *
 * /api/game-results is dashboard-only, because it is the specialist's own
 * channel during a live session. Home practice had no channel at all: the child
 * played, a score appeared on screen, and it vanished on refresh — so nothing
 * from home could ever reach a report.
 *
 * The result is written against a child the signed-in parent actually owns; the
 * studentId in the body is checked, never trusted.
 */
const Schema = z.object({
  studentId: z.string().min(1).max(100),
  gameId: z.string().min(1).max(50),
  gameLabelAr: z.string().max(100),
  score: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100),
  durationSeconds: z.number().min(0).max(7200),
  level: z.number().int().min(1).max(3),
})

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const payload = await verifyToken(cookieStore.get('parent_token')?.value)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // A child can finish a short exercise every few seconds; this only stops a
    // script from flooding the history that a clinical report is built on.
    const rl = await isRateLimited(`practice:${payload.id}:${getClientIp(req)}`, 120, 3600)
    if (rl.limited) {
      return NextResponse.json({ error: 'عدد كبير من المحاولات، حاول لاحقاً' }, { status: 429 })
    }

    const parsed = Schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
    }

    // IDOR guard: the child must belong to this parent. Without it any signed-in
    // parent could write practice history into another family's clinical record.
    const own = await getStudentsByParent(payload.id)
    if (!own.some(s => s.id === parsed.data.studentId)) {
      return NextResponse.json({ error: 'الطفل غير موجود' }, { status: 404 })
    }

    const result = await saveGameResult({
      studentId: parsed.data.studentId,
      gameId: parsed.data.gameId,
      gameLabelAr: parsed.data.gameLabelAr,
      // Marks the row's origin. Home practice is unsupervised — it is real
      // activity, but it is not the same evidence as a run the specialist
      // watched, and a later reader must be able to tell the two apart.
      sessionId: 'home-practice',
      score: Math.round(parsed.data.score),
      accuracy: Math.round(parsed.data.accuracy),
      reactionTimeMs: 0,
      level: parsed.data.level,
      durationSeconds: Math.round(parsed.data.durationSeconds),
      completed: true,
      playedAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, id: result.id })
  } catch (e) {
    console.error('[parent/practice-result]', e)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
