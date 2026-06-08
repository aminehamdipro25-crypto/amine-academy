import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { completeExercise } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('student_token')?.value
    const payload = await verifyToken(token)

    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { exerciseId, points } = body as { exerciseId?: string; points?: number }

    if (!exerciseId || typeof exerciseId !== 'string') {
      return NextResponse.json({ error: 'exerciseId required' }, { status: 400 })
    }
    if (typeof points !== 'number' || points < 0) {
      return NextResponse.json({ error: 'valid points required' }, { status: 400 })
    }

    const result = await completeExercise(payload.id, exerciseId, points)

    return NextResponse.json({
      ok: true,
      alreadyDone:    result.alreadyDone,
      pointsEarned:   result.pointsEarned,
      newTotalPoints: result.newTotalPoints,
      newStreak:      result.newStreak,
      newAchievements: result.newAchievements,
    })
  } catch (err) {
    console.error('[complete-exercise]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
