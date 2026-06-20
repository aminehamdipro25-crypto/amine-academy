import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getAppointment } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await isDashboardUser()) {
    return NextResponse.json({ appointment: null }, { status: 401 })
  }
  try {
    const appointment = await getAppointment(params.id)
    return NextResponse.json({ appointment })
  } catch {
    return NextResponse.json({ appointment: null })
  }
}
