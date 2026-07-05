import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

interface TreatmentGoal {
  id: string
  domain: string
  text: string
  target: string
  status: 'not-started' | 'in-progress' | 'achieved' | 'on-hold'
  addedAt: string
  achievedAt?: string
}

interface TreatmentPlan {
  studentId: string
  goals: TreatmentGoal[]
  updatedAt: string
  updatedBy?: string
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await isDashboardUser()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const plan = await redis.get<TreatmentPlan>(`treatment-plan:${params.id}`)
    return NextResponse.json({ plan: plan ?? null })
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve treatment plan' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await isDashboardUser()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const rawGoals = Array.isArray(body?.goals) ? body.goals : []

    const VALID_STATUSES = ['not-started', 'in-progress', 'achieved', 'on-hold']
    const VALID_DOMAINS  = ['انتباه', 'ذاكرة', 'لغة وقراءة', 'اجتماعي وعاطفي', 'حركي', 'سلوك', 'عام']

    const goals: TreatmentGoal[] = rawGoals.slice(0, 30).map((g: Record<string, unknown>) => ({
      id:         String(g?.id         ?? crypto.randomUUID()).slice(0, 60),
      domain:     VALID_DOMAINS.includes(String(g?.domain ?? '')) ? String(g.domain) : 'عام',
      text:       String(g?.text       ?? '').slice(0, 300),
      target:     String(g?.target     ?? '').slice(0, 200),
      status:     VALID_STATUSES.includes(String(g?.status ?? '')) ? String(g.status) as TreatmentGoal['status'] : 'not-started',
      addedAt:    String(g?.addedAt    ?? new Date().toISOString()).slice(0, 30),
      achievedAt: g?.achievedAt ? String(g.achievedAt).slice(0, 30) : undefined,
    }))

    const plan: TreatmentPlan = {
      studentId: params.id,
      goals,
      updatedAt: new Date().toISOString(),
    }

    await redis.set(`treatment-plan:${params.id}`, plan)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save treatment plan' }, { status: 500 })
  }
}
