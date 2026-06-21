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

  return <AdminDashboardView parents={parents} payments={payments} exercises={exercises} redisError={redisError} />
}
