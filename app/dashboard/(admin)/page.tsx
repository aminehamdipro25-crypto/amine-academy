import { getAllParents, getAllPendingPayments, getAllExercises } from '@/lib/db'
import AdminDashboardView from './AdminDashboardView'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminDashboardPage() {
  let parents:  Awaited<ReturnType<typeof getAllParents>>         = []
  let payments: Awaited<ReturnType<typeof getAllPendingPayments>> = []
  let exercises:Awaited<ReturnType<typeof getAllExercises>>       = []
  let redisError = false

  try {
    ;[parents, payments, exercises] = await Promise.all([
      getAllParents(),
      getAllPendingPayments(),
      getAllExercises(),
    ])
  } catch {
    redisError = true
  }

  // Strip passwordHash before it reaches the RSC payload — the client component
  // never needs it, but a raw prop is serialized to the browser regardless.
  const safeParents = parents.map(({ passwordHash, ...rest }) => rest)

  return <AdminDashboardView parents={safeParents} payments={payments} exercises={exercises} redisError={redisError} />
}
