import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudent, getStudentProgram, getAllExercises } from '@/lib/db'

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

    const [program, allExercises] = await Promise.all([
      getStudentProgram(params.id),
      getAllExercises(),
    ])
    const exerciseNames: Record<string, string> = {}
    for (const ex of allExercises) {
      exerciseNames[ex.id] = ex.titleAr || ex.title || ex.id
    }
    return NextResponse.json({ program, exerciseNames })
  } catch {
    return NextResponse.json({ program: null })
  }
}
