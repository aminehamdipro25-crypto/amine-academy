import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'
import type { LearningDifficultyProfile } from '@/lib/types'

export const runtime = 'nodejs'

const VALID_SEVERITIES = ['none', 'mild', 'moderate', 'severe']

async function requireAdmin(): Promise<boolean> {
  return isDashboardUser()
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ profile: null }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ profile: null })
  const sanitized = String(studentId).replace(/[^a-zA-Z0-9-_]/g, '')
  if (!sanitized) return NextResponse.json({ profile: null })
  try {
    const profile = await redis.get<LearningDifficultyProfile>(`ld-profile:${sanitized}`)
    return NextResponse.json({ profile })
  } catch (err) {
    console.error('[learning-difficulties GET]', err)
    return NextResponse.json({ profile: null })
  }
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json()
    if (!body.studentId) return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 })
    const sanitizedId = String(body.studentId).replace(/[^a-zA-Z0-9-_]/g, '')
    if (!sanitizedId) return NextResponse.json({ error: 'studentId غير صالح' }, { status: 400 })

    type Severity = 'none' | 'mild' | 'moderate' | 'severe'
    const validateSeverity = (v: unknown): Severity =>
      VALID_SEVERITIES.includes(v as string) ? (v as Severity) : 'none'

    const existing = await redis.get<LearningDifficultyProfile>(`ld-profile:${sanitizedId}`)
    const profile: LearningDifficultyProfile = {
      id: existing?.id || `LD-${Date.now().toString(36)}`,
      studentId: sanitizedId,
      dyslexia:       { severity: validateSeverity(body.dyslexia?.severity),       indicators: Array.isArray(body.dyslexia?.indicators) ? body.dyslexia.indicators : [] },
      dyscalculia:    { severity: validateSeverity(body.dyscalculia?.severity),    indicators: Array.isArray(body.dyscalculia?.indicators) ? body.dyscalculia.indicators : [] },
      dysgraphia:     { severity: validateSeverity(body.dysgraphia?.severity),     indicators: Array.isArray(body.dysgraphia?.indicators) ? body.dysgraphia.indicators : [] },
      workingMemory:  { severity: validateSeverity(body.workingMemory?.severity),  indicators: Array.isArray(body.workingMemory?.indicators) ? body.workingMemory.indicators : [] },
      processingSpeed:{ severity: validateSeverity(body.processingSpeed?.severity),indicators: Array.isArray(body.processingSpeed?.indicators) ? body.processingSpeed.indicators : [] },
      recommendations: Array.isArray(body.recommendations) ? body.recommendations : [],
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    }
    await redis.set(`ld-profile:${sanitizedId}`, profile, { ex: 365 * 24 * 3600 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[learning-difficulties POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
