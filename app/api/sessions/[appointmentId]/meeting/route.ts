import { NextRequest, NextResponse } from 'next/server'
import { getAppointment } from '@/lib/db'

export const runtime = 'nodejs'

// Public — returns only the meeting URL (no sensitive data)
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const appt = await getAppointment(params.appointmentId)
    if (!appt?.meetingUrl) return NextResponse.json({ meetingUrl: null })
    return NextResponse.json({ meetingUrl: appt.meetingUrl })
  } catch {
    return NextResponse.json({ meetingUrl: null })
  }
}
