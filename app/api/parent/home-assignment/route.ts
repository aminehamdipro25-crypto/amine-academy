import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent, getHomeAssignments } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// The active (latest) home plan for each of the signed-in parent's children.
export async function GET() {
  try {
    const token = (await cookies()).get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const children = await getStudentsByParent(payload.id)
    const perChild = await Promise.all(
      children.map(async child => {
        const assignments = await getHomeAssignments(child.id)
        const active = assignments[0] ?? null // newest first
        return active ? { ...active, studentId: child.id } : null
      }),
    )
    return NextResponse.json({ assignments: perChild.filter(Boolean) })
  } catch (e) {
    console.error('[parent/home-assignment]', e)
    return NextResponse.json({ assignments: [] })
  }
}
