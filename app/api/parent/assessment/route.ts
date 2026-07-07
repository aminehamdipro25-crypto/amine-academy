import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent } from '@/lib/db'
import { redis } from '@/lib/redis'
import type { AssessmentResult } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const children = await getStudentsByParent(payload.id)
    const targetChildren = studentId
      ? children.filter(c => c.id === studentId)
      : children
    if (targetChildren.length === 0) return NextResponse.json({ assessments: [] })

    const allIds = (await Promise.all(
      targetChildren.map(c => redis.lrange(`assessments:student:${c.id}`, 0, 19))
    )).flat()
    const records = (await Promise.all(
      allIds.map(id => redis.get<AssessmentResult>(`assessment:${id}`))
    )).filter(Boolean) as AssessmentResult[]

    records.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    return NextResponse.json({ assessments: records })
  } catch (err) {
    console.error('[parent/assessment GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_TYPES = ['adhd', 'autism', 'learning-difficulties', 'motor', 'cognitive', 'attention-domains']
const VALID_SEVERITIES = ['none', 'mild', 'moderate', 'severe']

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json()
    const { studentId, type, domainScores, totalScore, severity, recommendations, answers } = body

    if (!studentId || !type) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'نوع التقييم غير صالح' }, { status: 400 })
    }
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json({ error: 'مستوى الشدة غير صالح' }, { status: 400 })
    }

    // Verify student belongs to authenticated parent
    const children = await getStudentsByParent(payload.id)
    if (!children.some(c => c.id === studentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const id = `AR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    const result: AssessmentResult = {
      id,
      studentId: String(studentId).trim(),
      type,
      domainScores: domainScores || {},
      totalScore: Number(totalScore) || 0,
      severity: severity || 'none',
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      answers: Array.isArray(answers) ? answers : [],
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    await redis.pipeline([
      ['SET', `assessment:${id}`, JSON.stringify(result), 'EX', String(365 * 24 * 3600)],
      ['LPUSH', `assessments:student:${result.studentId}`, id],
    ])

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[parent/assessment POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
