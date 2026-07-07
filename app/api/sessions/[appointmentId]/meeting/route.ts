import { NextRequest, NextResponse } from 'next/server'
import { getAppointment } from '@/lib/db'
import { ensureDailyRoom, createMeetingToken } from '@/lib/daily'
import { authorizeSession } from '@/lib/session-access'

export const runtime = 'nodejs'

// Returns the meeting URL for a session. Authorized callers only (the
// specialist/staff running it, or the parent who owns the appointment) — this
// closes the enumeration hole where anyone guessing an appointmentId could
// pull the room URL and join a child's video call.
// Also refreshes the room's expiry and attaches a short-lived meeting token.
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const role = await authorizeSession(params.appointmentId)
    if (!role) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const appt = await getAppointment(params.appointmentId)
    if (!appt?.meetingUrl) return NextResponse.json({ meetingUrl: null })

    // Room name = last clean path segment (ignore any query/fragment suffix)
    const roomName = appt.meetingUrl
      .split(/[?#]/)[0]
      .split('/')
      .filter(Boolean)
      .pop()

    let url = appt.meetingUrl
    if (roomName) {
      const fresh = await ensureDailyRoom(roomName)
      if (fresh) url = fresh
      // Attach a token (owner for the specialist). Falls back to plain URL.
      const token = await createMeetingToken(roomName, role === 'dashboard')
      if (token) url = `${url.split(/[?#]/)[0]}?t=${token}`
    }
    return NextResponse.json({ meetingUrl: url })
  } catch {
    return NextResponse.json({ meetingUrl: null })
  }
}
