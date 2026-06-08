import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import type { LearningDifficultyProfile } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ profile: null })
  const profile = await redis.get<LearningDifficultyProfile>(`ld-profile:${studentId}`)
  return NextResponse.json({ profile })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })
    const existing = await redis.get<LearningDifficultyProfile>(`ld-profile:${body.studentId}`)
    const profile: LearningDifficultyProfile = {
      id: existing?.id || `LD-${Date.now().toString(36)}`,
      studentId: body.studentId,
      dyslexia: body.dyslexia || { severity: 'none', indicators: [] },
      dyscalculia: body.dyscalculia || { severity: 'none', indicators: [] },
      dysgraphia: body.dysgraphia || { severity: 'none', indicators: [] },
      workingMemory: body.workingMemory || { severity: 'none', indicators: [] },
      processingSpeed: body.processingSpeed || { severity: 'none', indicators: [] },
      recommendations: body.recommendations || [],
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    }
    await redis.set(`ld-profile:${body.studentId}`, profile, { ex: 365 * 24 * 3600 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
