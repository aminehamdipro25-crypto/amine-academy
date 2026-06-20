import { NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getExercise, updateExercise } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const ex = await getExercise(params.id)
    if (!ex) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ exercise: ex })
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const isAdmin = await isDashboardUser()
    if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const updates = await req.json()
    const exercise = await updateExercise(params.id, updates)
    if (!exercise) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ exercise })
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
