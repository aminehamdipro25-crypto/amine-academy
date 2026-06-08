import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudent, getStudentProgram, getAllExercises } from '@/lib/db'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('student_token')?.value
    const payload = await verifyToken(token)

    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().slice(0, 10)
    const completedTodayKey = `completed:${payload.id}:${today}`

    const [student, program, allExercises, completedTodayIds] = await Promise.all([
      getStudent(payload.id),
      getStudentProgram(payload.id),
      getAllExercises(),
      redis.smembers(completedTodayKey),
    ])

    if (!student) return NextResponse.json({ error: 'not found' }, { status: 404 })

    type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
    const todayDay = new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase() as WeekDay
    const todayExerciseIds = program?.weeklySchedule?.[todayDay] ?? []
    const todayExercises = allExercises.filter(ex => todayExerciseIds.includes(ex.id))

    return NextResponse.json({
      student,
      todayExercises,
      completedToday: completedTodayIds.length,
      completedTodayIds,
      program: program || null,
    })
  } catch (err) {
    console.error('[student-me]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
