import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getStudentProgressMap } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isDashboardUser()) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { sessions } = await getStudentProgressMap(id)
    return NextResponse.json({
      sessions,
      totalSessions: sessions.length,
      totalStars: sessions.reduce((s, n) => s + n.stars, 0),
    })
  } catch (err) {
    console.error('[admin student progress-map GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
