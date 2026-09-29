import { getAllParents, getAllPendingPayments, getAllExercises, getStaff } from '@/lib/db'
import { isOwnerUser, getDashboardActorId } from '@/lib/auth'
import AdminDashboardView from './AdminDashboardView'
import TeacherHome from './TeacherHome'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminDashboardPage() {
  // A language teacher (staff) gets their own focused home — never the owner's
  // business data, which is not even fetched or sent to their browser.
  if (!(await isOwnerUser())) {
    const actor = await getDashboardActorId()
    const staffId = actor?.startsWith('staff:') ? actor.slice(6) : null
    const staff = staffId ? await getStaff(staffId) : null
    return <TeacherHome name={staff?.name || 'أستاذ'} />
  }

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
