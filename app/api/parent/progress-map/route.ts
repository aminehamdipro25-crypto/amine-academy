import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent, getStudentProgressMap } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
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
        const { sessions } = await getStudentProgressMap(student.id)
        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          sessions,
          totalSessions: sessions.length,
          totalStars: sessions.reduce((s, n) => s + n.stars, 0),
        }
      })
    )
    return NextResponse.json({ progressData })
  } catch (err) {
    console.error('[parent progress-map GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
