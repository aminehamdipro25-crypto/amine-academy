import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { generateId } from '@/lib/auth'
import type { AssessmentResult } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.studentId || !body.type) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }
    const id = `AR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    const result: AssessmentResult = {
      id,
      studentId: body.studentId,
      type: body.type,
      subtype: body.subtype,
      domainScores: body.domainScores || {},
      totalScore: body.totalScore || 0,
      severity: body.severity || 'none',
      recommendations: body.recommendations || [],
      answers: body.answers || [],
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    await redis.pipeline([
      ['SET', `assessment:${id}`, JSON.stringify(result), 'EX', String(365 * 24 * 3600)],
      ['LPUSH', `assessments:student:${body.studentId}`, id],
    ])
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    if (!studentId) return NextResponse.json({ results: [] })
    const ids = await redis.lrange(`assessments:student:${studentId}`, 0, 20)
    const results = await Promise.all(
      ids.map(id => redis.get<AssessmentResult>(`assessment:${id}`))
    )
    return NextResponse.json({ results: results.filter(Boolean) })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
