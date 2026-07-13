import { NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getExercise, updateExercise } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const ex = await getExercise(params.id)
    if (!ex) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ exercise: ex })
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
