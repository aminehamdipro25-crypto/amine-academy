import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getStudentGameHistory, getStudentGameResults } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  if (!await isDashboardUser()) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const [history, recentResults] = await Promise.all([
      getStudentGameHistory(params.studentId),
      getStudentGameResults(params.studentId, 20),
    ])
    return NextResponse.json({ history, recentResults })
  } catch (err) {
    console.error('[admin game-progress GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
