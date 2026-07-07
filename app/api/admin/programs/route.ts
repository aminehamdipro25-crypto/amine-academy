import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { createProgram, getStudentProgram, getAllExercises, getExercise } from '@/lib/db'

export const runtime = 'nodejs'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export async function POST(req: NextRequest) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body?.studentId || !body?.title || !body?.startDate || !body?.endDate) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })
    }

    const weeklySchedule: Record<string, string[]> = {}
    for (const day of DAYS) {
      weeklySchedule[day] = Array.isArray(body.weeklySchedule?.[day]) ? body.weeklySchedule[day] : []
    }

    const exerciseIds = new Set<string>()
    for (const day of DAYS) {
      weeklySchedule[day].forEach(id => exerciseIds.add(id))
    }

    const exerciseIdArray = Array.from(exerciseIds)

    // Resolve exercise names at save time so they survive future re-seeding
    const labelRecords = await Promise.all(exerciseIdArray.map(id => getExercise(id)))
    const exerciseLabels: Record<string, string> = {}
    for (const ex of labelRecords) {
      if (ex) exerciseLabels[ex.id] = ex.titleAr || ex.title || ex.id
    }

    const program = await createProgram({
      studentId: body.studentId,
      professorId: 'admin',
      title: body.title,
      startDate: body.startDate,
      endDate: body.endDate,
      weeklySchedule: weeklySchedule as unknown as Parameters<typeof createProgram>[0]['weeklySchedule'],
      exerciseIds: exerciseIdArray,
      exerciseLabels,
      status: 'active',
      progressPercentage: 0,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, program }, { status: 201 })
  } catch (e) {
    console.error('[admin/programs/post]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const rawStudentId = new URL(req.url).searchParams.get('studentId')
    const studentId = rawStudentId ? rawStudentId.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 100) : ''
    if (!studentId) return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 })

    const [program, allExercises] = await Promise.all([
      getStudentProgram(studentId),
      getAllExercises(),
    ])

    // Backfill exerciseLabels for programs saved before this feature was added
    if (program && !program.exerciseLabels) {
      const labelMap: Record<string, string> = {}
      for (const ex of allExercises) { labelMap[ex.id] = ex.titleAr || ex.title || ex.id }
      program.exerciseLabels = labelMap
    }

    return NextResponse.json({ program, allExercises })
  } catch (e) {
    console.error('[admin/programs/get]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
