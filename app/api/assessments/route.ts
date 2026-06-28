import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser, getDashboardActorId } from '@/lib/auth'
import { redis } from '@/lib/redis'
import type { AssessmentResult } from '@/lib/types'

export const runtime = 'nodejs'

const VALID_TYPES = ['adhd', 'autism', 'learning-difficulties', 'anxiety', 'behavior', 'attention-domains', 'motor', 'cognitive']
const VALID_SEVERITIES = ['none', 'mild', 'moderate', 'severe']

async function requireAdmin(): Promise<boolean> {
  return isDashboardUser()
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json()
    if (!body.studentId || !body.type) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }
    const studentId = String(body.studentId).trim().replace(/[^a-zA-Z0-9-_]/g, '')
    if (!studentId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }
    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: 'نوع التقييم غير صالح' }, { status: 400 })
    }
    if (body.severity && !VALID_SEVERITIES.includes(body.severity)) {
      return NextResponse.json({ error: 'مستوى الشدة غير صالح' }, { status: 400 })
    }
    const id = `AR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    const sessionId = typeof body.sessionId === 'string'
      ? body.sessionId.trim().replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 100)
      : ''
    const result: AssessmentResult = {
      id,
      studentId,
      sessionId: sessionId || undefined,
      type: body.type,
      subtype: body.subtype,
      domainScores: body.domainScores || {},
      totalScore: Number(body.totalScore) || 0,
      severity: body.severity || 'none',
      recommendations: Array.isArray(body.recommendations) ? body.recommendations : [],
      answers: Array.isArray(body.answers) ? body.answers : [],
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      assessedByName: typeof body.assessedByName === 'string' ? body.assessedByName.trim().slice(0, 120) : undefined,
      assessedByActorId: (await getDashboardActorId()) ?? undefined,
      clinicalNotes: typeof body.clinicalNotes === 'string' ? body.clinicalNotes.trim().slice(0, 2000) : undefined,
    }
    await redis.pipeline([
      ['SET', `assessment:${id}`, JSON.stringify(result), 'EX', String(365 * 24 * 3600)],
      ['LPUSH', `assessments:student:${result.studentId}`, id],
    ])
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[assessments POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ results: [] }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    if (!studentId) return NextResponse.json({ results: [] })
    const sanitized = String(studentId).replace(/[^a-zA-Z0-9-_]/g, '')
    if (!sanitized) return NextResponse.json({ results: [] })
    const ids = await redis.lrange(`assessments:student:${sanitized}`, 0, 20)
    const results = await Promise.all(
      ids.map(id => redis.get<AssessmentResult>(`assessment:${id}`))
    )
    return NextResponse.json({ results: results.filter(Boolean) })
  } catch (err) {
    console.error('[assessments GET]', err)
    return NextResponse.json({ results: [] })
  }
}
