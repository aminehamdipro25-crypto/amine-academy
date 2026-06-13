import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getStudentGameHistory, getStudentGameResults } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!await verifyAdminSession(token)) {
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
