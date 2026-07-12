import { NextRequest, NextResponse } from 'next/server'
import { getAppointment, updateAppointment } from '@/lib/db'
import { ensureDailyRoom, dailyRoomNameFor } from '@/lib/daily'
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
    if (!appt) return NextResponse.json({ meetingUrl: null })

    // The room name is DETERMINISTIC from the appointment id. Derive it (from a
    // stored meetingUrl if present, else compute it) and ensure the room —
    // ensureDailyRoom CREATES it if it doesn't exist yet. This is what makes
    // video work for appointments that never got a room at booking time:
    // free-assessment sessions (created with meetingUrl:'') and any appointment
    // whose room creation failed or ran before DAILY_API_KEY was configured.
    const roomName =
      (appt.meetingUrl && appt.meetingUrl.split(/[?#]/)[0].split('/').filter(Boolean).pop()) ||
      dailyRoomNameFor(params.appointmentId)

    const url = await ensureDailyRoom(roomName)
    if (!url) return NextResponse.json({ meetingUrl: null })

    // Persist so the parent's "join" button (gated on a stored meetingUrl for
    // upcoming appointments) appears, and future loads skip the ensure round-trip.
    if (appt.meetingUrl !== url) {
      await updateAppointment(params.appointmentId, { meetingUrl: url }).catch(() => {})
    }
    return NextResponse.json({ meetingUrl: url })
  } catch {
    return NextResponse.json({ meetingUrl: null })
  }
}
