import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudent, getStudentProgram, getExercise } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Verify the student belongs to this parent
    const student = await getStudent(params.id)
    if (!student || student.parentId !== payload.id) {
      return NextResponse.json({ program: null })
    }

    const program = await getStudentProgram(params.id)

    // Collect the unique exercise IDs actually used in this program's schedule
    const schedule = (program?.weeklySchedule ?? {}) as Record<string, string[]>
    const usedIds = [...new Set(Object.values(schedule).flat().filter(Boolean))]

    // Look up each exercise directly by its Redis key — more reliable than the index list
    const exerciseNames: Record<string, string> = {}
    if (usedIds.length > 0) {
      const records = await Promise.all(usedIds.map(id => getExercise(id)))
      for (const ex of records) {
        if (ex) exerciseNames[ex.id] = ex.titleAr || ex.title || ex.id
      }
    }

    return NextResponse.json({ program, exerciseNames })
  } catch {
    return NextResponse.json({ program: null })
  }
}
