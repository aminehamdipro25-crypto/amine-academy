import { getAllParents, getAllExercises, getAllAppointments, getAllPendingPayments } from '@/lib/db'
import AnalyticsView from './AnalyticsView'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AnalyticsPage() {
  let parents: Awaited<ReturnType<typeof getAllParents>> = []
  let exercises: Awaited<ReturnType<typeof getAllExercises>> = []
  let appointments: Awaited<ReturnType<typeof getAllAppointments>> = []
  let payments: Awaited<ReturnType<typeof getAllPendingPayments>> = []
  let error = false

  try {
    ;[parents, exercises, appointments, payments] = await Promise.all([
      getAllParents(),
      getAllExercises(),
      getAllAppointments(),
      getAllPendingPayments(),
    ])
  } catch {
    error = true
  }

  return <AnalyticsView parents={parents} exercises={exercises} appointments={appointments} payments={payments} error={error} />
}
