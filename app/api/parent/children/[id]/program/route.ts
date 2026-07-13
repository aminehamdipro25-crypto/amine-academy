import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudent, getStudentProgram, getExercise } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

    // If the program already has embedded labels (saved after the new flow), use them directly
    if (program?.exerciseLabels && Object.keys(program.exerciseLabels).length > 0) {
      return NextResponse.json({ program, exerciseNames: program.exerciseLabels })
    }

    // Fallback: resolve labels by looking up each exercise ID directly in Redis
    const schedule = (program?.weeklySchedule ?? {}) as Record<string, string[]>
    const usedIds = [...new Set(Object.values(schedule).flat().filter(Boolean))]
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
