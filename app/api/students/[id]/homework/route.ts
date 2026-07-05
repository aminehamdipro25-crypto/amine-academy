import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

interface HomeworkAssignment {
  exercises: Array<{ id: string; labelAr: string; icon: string; category: string }>
  note: string
  sessionId: string
  difficulty: number
  createdAt: string
  therapistName?: string
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
    const rawExercises = Array.isArray(body?.exercises) ? body.exercises : []
    const homework: HomeworkAssignment = {
      exercises: rawExercises.slice(0, 20).map((e: Record<string, unknown>) => ({
        id:       String(e?.id       ?? '').slice(0, 60),
        labelAr:  String(e?.labelAr  ?? '').slice(0, 120),
        icon:     String(e?.icon     ?? '').slice(0, 10),
        category: String(e?.category ?? '').slice(0, 60),
      })),
      note:       String(body?.note       ?? '').slice(0, 1000),
      sessionId:  String(body?.sessionId  ?? '').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 60),
      difficulty: ([1,2,3].includes(Number(body?.difficulty)) ? Number(body.difficulty) : 1) as unknown as number,
      createdAt: new Date().toISOString(),
    }

    await redis.set(`homework:${params.id}`, homework)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save homework' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await isDashboardUser()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const homework = await redis.get<HomeworkAssignment>(`homework:${params.id}`)
    return NextResponse.json({ homework: homework ?? null })
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve homework' }, { status: 500 })
  }
}
