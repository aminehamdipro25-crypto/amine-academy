import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getParent, getStudentsByParent, getStudentReports } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const parent = await getParent(payload.id)
    if (!parent) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const children = await getStudentsByParent(payload.id)
    const reportsPerChild = await Promise.all(
      children.map(async child => {
        const reports = await getStudentReports(child.id)
        return { child, reports }
      })
    )

    return NextResponse.json({ reportsPerChild })
  } catch (err) {
    console.error('[parent-reports]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
