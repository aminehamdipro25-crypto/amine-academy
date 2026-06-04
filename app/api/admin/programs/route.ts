import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { createProgram, getStudentProgram, getAllExercises } from '@/lib/db'

export const runtime = 'nodejs'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!await verifyAdminSession(token)) {
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
    const program = await createProgram({
      studentId: body.studentId,
      professorId: 'admin',
      title: body.title,
      startDate: body.startDate,
      endDate: body.endDate,
      weeklySchedule: weeklySchedule as unknown as Parameters<typeof createProgram>[0]['weeklySchedule'],
      exerciseIds: exerciseIdArray,
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
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!await verifyAdminSession(token)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const studentId = new URL(req.url).searchParams.get('studentId')
    if (!studentId) return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 })

    const [program, allExercises] = await Promise.all([
      getStudentProgram(studentId),
      getAllExercises(),
    ])

    return NextResponse.json({ program, allExercises })
  } catch (e) {
    console.error('[admin/programs/get]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
