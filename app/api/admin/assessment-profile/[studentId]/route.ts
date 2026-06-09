import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getAssessmentProfile, saveAssessmentProfile } from '@/lib/db'

export const runtime = 'nodejs'

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  return verifyAdminSession(token || '')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const profile = await getAssessmentProfile(params.studentId)
  return NextResponse.json({ profile })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = await req.json()
    const profile = await saveAssessmentProfile(params.studentId, body)
    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json({ error: 'خطأ في الحفظ' }, { status: 500 })
  }
}
