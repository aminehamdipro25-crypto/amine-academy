import { NextResponse } from 'next/server'
import { verifyToken, isDashboardUser } from '@/lib/auth'
import { getAllExercises, createExercise } from '@/lib/db'
import type { AgeGroup, Diagnosis, ExerciseCategory } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ageGroup = searchParams.get('age') as AgeGroup | null
    const category = searchParams.get('category') as ExerciseCategory | null
    const diagnosis = searchParams.get('diagnosis') as Diagnosis | null
    const exactAgeRaw = searchParams.get('exactAge')
    const exactAge = exactAgeRaw && /^\d{1,2}$/.test(exactAgeRaw) ? Number(exactAgeRaw) : null

    let exercises = await getAllExercises()

    if (ageGroup)  exercises = exercises.filter(e => e.ageGroups.includes(ageGroup))
    // Precise age window: when the child's real age is known, drop exercises whose
    // minAge/maxAge excludes it (e.g. young-child play hidden from an 11-year-old).
    if (exactAge !== null) {
      exercises = exercises.filter(e =>
        (e.minAge == null || exactAge >= e.minAge) &&
        (e.maxAge == null || exactAge <= e.maxAge))
    }
    if (category)  exercises = exercises.filter(e => e.category === category)
    if (diagnosis) exercises = exercises.filter(e => e.diagnoses.includes(diagnosis))

    return NextResponse.json({ exercises })
  } catch (err) {
    console.error('[exercises-get]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await isDashboardUser()
    if (!isAdmin) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const exercise = await createExercise(data)
    return NextResponse.json({ exercise }, { status: 201 })
  } catch (err) {
    console.error('[exercises-post]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
