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
    const { exercises, note, sessionId, difficulty } = await req.json()

    const homework: HomeworkAssignment = {
      exercises,
      note,
      sessionId,
      difficulty,
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
  try {
    const homework = await redis.get<HomeworkAssignment>(`homework:${params.id}`)
    return NextResponse.json({ homework: homework ?? null })
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve homework' }, { status: 500 })
  }
}
