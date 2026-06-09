import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent, getStudentGameHistory } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_token')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const students = await getStudentsByParent(payload.id)
    const progressData = await Promise.all(
      students.map(async (student) => {
        const history = await getStudentGameHistory(student.id)
        return { student, history }
      })
    )
    return NextResponse.json({ progressData })
  } catch (err) {
    console.error('[parent game-progress GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
