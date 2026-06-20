import { NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getStudentProgram } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const { id } = await params
    const program = await getStudentProgram(id)
    return NextResponse.json({ program: program ?? null })
  } catch (e) {
    console.error('[admin/students/program]', e)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
