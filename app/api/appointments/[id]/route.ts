import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getAppointment } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!await verifyAdminSession(token)) {
    return NextResponse.json({ appointment: null }, { status: 401 })
  }
  try {
    const appointment = await getAppointment(params.id)
    return NextResponse.json({ appointment })
  } catch {
    return NextResponse.json({ appointment: null })
  }
}
