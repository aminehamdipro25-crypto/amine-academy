import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent } from '@/lib/db'
import { redis } from '@/lib/redis'
import type { AssessmentResult } from '@/lib/types'
import { buildRecommendedPlan, buildPlanFromVanderbilt } from '@/lib/assessment-plan'
import type { DomainKey } from '@/lib/assessment-data'
import { scoreVanderbilt, VANDERBILT_ITEMS, PERFORMANCE_ITEMS } from '@/lib/vanderbilt-data'

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

const VALID_TYPES = ['adhd', 'autism', 'learning-difficulties', 'motor', 'cognitive', 'attention-domains', 'vanderbilt-adhd']
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

    // ── Vanderbilt (validated) path — score entirely server-side from the raw
    // answers so the screen result and plan can't be forged by the client. ──
    if (type === 'vanderbilt-adhd') {
      const rawAnswers = (body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)) ? body.answers : {}
      const rawPerf = (body.performance && typeof body.performance === 'object' && !Array.isArray(body.performance)) ? body.performance : {}

      const validIds = new Set(VANDERBILT_ITEMS.map(i => i.id))
      const answers: Record<number, number> = {}
      for (const item of VANDERBILT_ITEMS) {
        const v = Number(rawAnswers[item.id])
        answers[item.id] = validIds.has(item.id) && v >= 0 && v <= 3 ? Math.round(v) : 0
      }
      const validPerf = new Set(PERFORMANCE_ITEMS.map(p => p.id))
      const performance: Record<string, number> = {}
      for (const p of PERFORMANCE_ITEMS) {
        const v = Number(rawPerf[p.id])
        performance[p.id] = validPerf.has(p.id) && v >= 1 && v <= 5 ? Math.round(v) : 3
      }

      const vb = scoreVanderbilt(answers, performance)
      const plan = buildPlanFromVanderbilt(vb)

      const id = `AR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
      const result: AssessmentResult = {
        id,
        studentId: String(studentId).trim(),
        type: 'vanderbilt-adhd',
        domainScores: {
          inattention: vb.inattentionCount,
          hyperactivity: vb.hyperactivityCount,
          oppositional: vb.oppositionalCount,
        },
        totalScore: vb.totalAdhdSymptoms,
        severity: vb.severity,
        recommendations: plan.focusExercises,
        vanderbilt: {
          inattentionCount: vb.inattentionCount,
          hyperactivityCount: vb.hyperactivityCount,
          oppositionalCount: vb.oppositionalCount,
          hasImpairment: vb.hasImpairment,
          subtype: vb.subtype,
        },
        recommendedPlan: plan,
        answers: VANDERBILT_ITEMS.map(i => ({ itemId: String(i.id), rating: answers[i.id] as 0 | 1 | 2 | 3 })),
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }

      await redis.pipeline([
        ['SET', `assessment:${id}`, JSON.stringify(result), 'EX', String(365 * 24 * 3600)],
        ['LPUSH', `assessments:student:${result.studentId}`, id],
      ])

      return NextResponse.json({ ok: true, id, result })
    }

    // domainScores/recommendations are parent-authored free text that later
    // flows verbatim into the specialist's AI program-generation prompt
    // (formatAssessmentsForPrompt in ai-generate-program) — cap length/count
    // so a parent can't inject arbitrarily long prompt-steering text there.
    const safeDomainScores: Record<string, number> = {}
    if (domainScores && typeof domainScores === 'object' && !Array.isArray(domainScores)) {
      for (const [k, v] of Object.entries(domainScores).slice(0, 20)) {
        safeDomainScores[String(k).slice(0, 60)] = Math.min(1000, Math.max(-1000, Number(v) || 0))
      }
    }
    const safeRecommendations = Array.isArray(recommendations)
      ? recommendations.slice(0, 20).map(r => String(r).slice(0, 300))
      : []

    // Compute the recommended starting plan server-side (from the sanitized
    // scores, not client-supplied) so it can't be tampered with — only the
    // attention-domains instrument produces the 4-domain plan.
    const safeTotal = Number(totalScore) || 0
    const recommendedPlan = type === 'attention-domains'
      ? buildRecommendedPlan(safeDomainScores as Record<DomainKey, number>, safeTotal)
      : undefined

    const id = `AR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    const result: AssessmentResult = {
      id,
      studentId: String(studentId).trim(),
      type,
      domainScores: safeDomainScores,
      totalScore: safeTotal,
      severity: severity || 'none',
      recommendations: safeRecommendations,
      recommendedPlan,
      answers: Array.isArray(answers) ? answers.slice(0, 200) : [],
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
