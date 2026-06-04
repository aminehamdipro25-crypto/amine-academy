import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, verifyAdminSession } from '@/lib/auth'
import { getAllExercises, createExercise } from '@/lib/db'
import type { AgeGroup, Diagnosis, ExerciseCategory } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ageGroup = searchParams.get('age') as AgeGroup | null
  const category = searchParams.get('category') as ExerciseCategory | null
  const diagnosis = searchParams.get('diagnosis') as Diagnosis | null

  let exercises = await getAllExercises()

  if (ageGroup) exercises = exercises.filter(e => e.ageGroups.includes(ageGroup))
  if (category) exercises = exercises.filter(e => e.category === category)
  if (diagnosis) exercises = exercises.filter(e => e.diagnoses.includes(diagnosis))

  return NextResponse.json({ exercises })
}

export async function POST(req: Request) {
  const adminToken = cookies().get('admin_token')?.value
  const isAdmin = await verifyAdminSession(adminToken)
  if (!isAdmin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const data = await req.json()
  const exercise = await createExercise(data)
  return NextResponse.json({ exercise }, { status: 201 })
}
