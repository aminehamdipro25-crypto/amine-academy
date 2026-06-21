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

  return <AppointmentsView appointments={appointments} parents={parents} error={error} />
}
