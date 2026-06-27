import { getAllAppointments, getAllParents } from '@/lib/db'
import AppointmentsView from './AppointmentsView'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AppointmentsPage() {
  let appointments: Awaited<ReturnType<typeof getAllAppointments>> = []
  let parents: Awaited<ReturnType<typeof getAllParents>> = []
  let error = false

  try {
    ;[appointments, parents] = await Promise.all([getAllAppointments(), getAllParents()])
  } catch {
    error = true
  }

  // Strip passwordHash before it reaches the RSC payload — the client component
  // never needs it, but a raw prop is serialized to the browser regardless.
  const safeParents = parents.map(({ passwordHash, ...rest }) => rest)

  return <AppointmentsView appointments={appointments} parents={safeParents} error={error} />
}
