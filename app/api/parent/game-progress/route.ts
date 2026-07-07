import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent, getStudentGameHistory, saveGameResult } from '@/lib/db'

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

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_token')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { studentId, gameId, gameLabelAr, score, accuracy, durationSeconds } = body
    if (!studentId || !gameId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // Verify student belongs to this parent
    const students = await getStudentsByParent(payload.id)
    if (!students.some(s => s.id === studentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const result = await saveGameResult({
      gameId,
      gameLabelAr: gameLabelAr || gameId,
      sessionId: `parent-home-${new Date().toISOString().slice(0, 10)}`,
      studentId,
      playedAt: new Date().toISOString(),
      score:           Number(score) || 0,
      accuracy:        Number(accuracy) || 0,
      reactionTimeMs:  0,
      level:           1,
      durationSeconds: Number(durationSeconds) || 0,
      completed:       true,
    })
    return NextResponse.json({ result })
  } catch (err) {
    console.error('[parent game-progress POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
