import { cookies } from 'next/headers'
import { isDashboardUser, verifyToken } from './auth'
import { getAppointment } from './db'

export type SessionRole = 'dashboard' | 'parent'

// Authorize access to a specific session's data (video URL, live exercise,
// whiteboard, content, kid-status). A caller is allowed when they are:
//   • a dashboard user (owner/staff running the session), OR
//   • the parent who owns the appointment (child's own device).
// Returns the resolved role, or null when unauthorized.
export async function authorizeSession(appointmentId: string): Promise<SessionRole | null> {
  // Specialist / staff
  if (await isDashboardUser()) return 'dashboard'

  // Parent who owns this appointment
  const store = await cookies()
  const payload = await verifyToken(store.get('parent_token')?.value)
  if (payload?.role === 'parent') {
    const appt = await getAppointment(appointmentId)
    if (appt && appt.parentId === payload.id) return 'parent'
  }
  return null
}
