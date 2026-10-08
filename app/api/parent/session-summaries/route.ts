import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent, getSessionSummaries } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// All in-person session summaries for the signed-in parent's children, each
// tagged with the child's name, newest first.
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
        const summaries = await getSessionSummaries(child.id)
        const childName = `${child.firstName} ${child.lastName}`.trim()
        return summaries.map(s => ({ ...s, childName }))
      }),
    )
    const summaries = perChild.flat().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return NextResponse.json({ summaries })
  } catch (e) {
    console.error('[parent/session-summaries]', e)
    return NextResponse.json({ summaries: [] })
  }
}
