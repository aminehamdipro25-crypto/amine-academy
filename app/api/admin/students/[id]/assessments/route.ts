import { NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getStudentAssessments } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Parent-completed assessments (with the derived recommended plan) for the
// specialist to review on the client page — so the proposed session count and
// target-domain path are visible, not just fed silently into AI generation.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const { id } = await params
    const assessments = await getStudentAssessments(id)
    return NextResponse.json({ assessments })
  } catch (e) {
    console.error('[admin/students/assessments]', e)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
