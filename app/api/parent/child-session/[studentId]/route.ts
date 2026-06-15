import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent, getStudentProgram, getAllExercises, completeExercise } from '@/lib/db'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getParentAndStudent(studentId: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_token')?.value
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'parent') return null

  const children = await getStudentsByParent(payload.id)
  const student = children.find(c => c.id === studentId)
  if (!student) return null

  return { parentId: payload.id, student }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params
    const ctx = await getParentAndStudent(studentId)
    if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const today = new Date().toISOString().slice(0, 10)
    const completedKey = `completed:${studentId}:${today}`

    const [program, allExercises, completedIds] = await Promise.all([
      getStudentProgram(studentId),
      getAllExercises(),
      redis.smembers(completedKey),
    ])

    type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
    const todayDay = new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase() as WeekDay
    const todayIds = program?.weeklySchedule?.[todayDay] ?? []
    const todayExercises = allExercises.filter(ex => todayIds.includes(ex.id))

    return NextResponse.json({
      student: ctx.student,
      todayExercises,
      completedTodayIds: completedIds,
    })
  } catch (err) {
    console.error('[child-session/get]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params
    const ctx = await getParentAndStudent(studentId)
    if (!ctx) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const body = await req.json()
    const { exerciseId, points } = body as { exerciseId?: string; points?: number }

    if (!exerciseId || typeof exerciseId !== 'string') {
      return NextResponse.json({ error: 'exerciseId مطلوب' }, { status: 400 })
    }
    if (typeof points !== 'number' || points < 0) {
      return NextResponse.json({ error: 'points غير صحيحة' }, { status: 400 })
    }

    const result = await completeExercise(studentId, exerciseId, points)
    return NextResponse.json({
      ok: true,
      alreadyDone:     result.alreadyDone,
      pointsEarned:    result.pointsEarned,
      newTotalPoints:  result.newTotalPoints,
      newStreak:       result.newStreak,
      newAchievements: result.newAchievements,
    })
  } catch (err) {
    console.error('[child-session/post]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
