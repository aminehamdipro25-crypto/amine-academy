import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { saveGameResult } from '@/lib/db'
import { z } from 'zod'

export const runtime = 'nodejs'

const GameResultSchema = z.object({
  gameId:          z.string().min(1).max(50),
  gameLabelAr:     z.string().max(100),
  sessionId:       z.string().min(1).max(100),
  studentId:       z.string().min(1).max(100),
  score:           z.number().min(0).max(100),
  accuracy:        z.number().min(0).max(100),
  reactionTimeMs:  z.number().min(0),
  level:           z.number().int().min(1).max(3),
  durationSeconds: z.number().min(0),
  completed:       z.boolean(),
})

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!await verifyAdminSession(token)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const parsed = GameResultSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: parsed.error.flatten() }, { status: 400 })
    }
    const result = await saveGameResult({
      ...parsed.data,
      playedAt: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, id: result.id })
  } catch (err) {
    console.error('[game-results POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
