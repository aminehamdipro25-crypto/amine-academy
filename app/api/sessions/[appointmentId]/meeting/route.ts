import { NextRequest, NextResponse } from 'next/server'
import { getAppointment } from '@/lib/db'
import { ensureDailyRoom } from '@/lib/daily'

export const runtime = 'nodejs'

// Public — returns only the meeting URL (no sensitive data).
// Also refreshes the Daily.co room so it never joins an expired room
// (rooms carry an `exp`; a long-scheduled or re-opened session would
// otherwise fail with "تعذر الاتصال بالمكالمة").
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const appt = await getAppointment(params.appointmentId)
    if (!appt?.meetingUrl) return NextResponse.json({ meetingUrl: null })

    // Room name = last path segment of the stored URL
    const roomName = appt.meetingUrl.split('/').filter(Boolean).pop()
    if (roomName) {
      const fresh = await ensureDailyRoom(roomName)
      if (fresh) return NextResponse.json({ meetingUrl: fresh })
    }
    // Fall back to the stored URL if the refresh call couldn't run
    return NextResponse.json({ meetingUrl: appt.meetingUrl })
  } catch {
    return NextResponse.json({ meetingUrl: null })
  }
}
