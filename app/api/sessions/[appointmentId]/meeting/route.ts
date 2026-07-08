import { NextRequest, NextResponse } from 'next/server'
import { getAppointment } from '@/lib/db'
import { ensureDailyRoom } from '@/lib/daily'
import { authorizeSession } from '@/lib/session-access'
import { isRateLimited } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// Returns the meeting URL for a session. Authorized callers only (the
// specialist/staff running it, or the parent who owns the appointment) — this
// closes the enumeration hole where anyone guessing an appointmentId could
// pull the room URL and join a child's video call.
// Also refreshes the room's expiry so it's never handed back expired.
//
// Deliberately NOT attaching a Daily meeting token here (?t=...): the rooms
// are not privacy:'private', so a token isn't required to join, and doing so
// added an untested join-time failure mode (bad/rejected token → the whole
// call fails) for a security benefit that's already covered by the auth
// gate above, which is the real, load-bearing control. Revisit only paired
// with switching rooms to privacy:'private' and testing the join live.
export async function GET(
  _req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    if (!await authorizeSession(params.appointmentId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // This call reaches out to the Daily.co API (room refresh) — cap retries
    // so a reconnect loop can't hammer Daily's API.
    const rl = await isRateLimited(`session_meeting_get:${params.appointmentId}`, 20, 60)
    if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة جداً' }, { status: 429 })

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
    }
    return NextResponse.json({ meetingUrl: url })
  } catch {
    return NextResponse.json({ meetingUrl: null })
  }
}
