import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudent, getStudentProgram, getAllExercises } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const token = cookies().get('student_token')?.value
  const payload = await verifyToken(token)

  if (!payload || payload.role !== 'student') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [student, program, allExercises] = await Promise.all([
    getStudent(payload.id),
    getStudentProgram(payload.id),
    getAllExercises(),
  ])

  if (!student) return NextResponse.json({ error: 'not found' }, { status: 404 })

  type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  const today = new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase() as WeekDay
  const todayExerciseIds = program?.weeklySchedule?.[today] ?? []
  const todayExercises = allExercises.filter(ex => todayExerciseIds.includes(ex.id))

  return NextResponse.json({
    student,
    todayExercises,
    completedToday: 0,
    program: program || null,
  })
}
