import { getAllParents, getAllExercises, getAllAppointments, getAllPendingPayments } from '@/lib/db'
import type { Parent, Exercise, Appointment, PendingPayment } from '@/lib/types'
import AnalyticsView from './AnalyticsView'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export interface AnalyticsData {
  totalClients: number
  totalExercises: number
  totalAppointments: number
  revenueByCurrency: Record<string, number>
  revenueLast30dByCurrency: Record<string, number>
  hasConfirmedPayments: boolean
  statusCounts: { active: number; pending: number; suspended: number; expired: number; cancelled: number }
  planCounts: { basic: number; standard: number; premium: number; session: number; weekly: number; monthly: number }
  topCountries: [string, number][]
  catCounts: Record<string, number>
  months: { year: number; month: number; count: number }[]
  apptStats: { scheduled: number; completed: number; cancelled: number }
}

// Only aggregate, non-identifying figures may leave this function — the raw
// Parent/Appointment/PendingPayment records carry password hashes and PII
// (email, phone, admin notes) and must never be passed to the client component,
// since Server Component -> Client Component props are serialized into the
// page's payload regardless of which fields the UI actually renders.
function computeAnalytics(
  parents: Parent[], exercises: Exercise[], appointments: Appointment[], payments: PendingPayment[]
): AnalyticsData {
  const confirmedPayments = payments.filter(p => p.status === 'confirmed')
  const revenueByCurrency: Record<string, number> = {}
  confirmedPayments.forEach(p => {
    revenueByCurrency[p.currency] = (revenueByCurrency[p.currency] ?? 0) + p.amount
  })
  const now30 = Date.now() - 30 * 24 * 3600 * 1000
  const revenueLast30dByCurrency: Record<string, number> = {}
  confirmedPayments
    .filter(p => new Date(p.createdAt).getTime() >= now30)
    .forEach(p => {
      revenueLast30dByCurrency[p.currency] = (revenueLast30dByCurrency[p.currency] ?? 0) + p.amount
    })

  const statusCounts = {
    active:    parents.filter(p => p.subscriptionStatus === 'active').length,
    pending:   parents.filter(p => p.subscriptionStatus === 'pending').length,
    suspended: parents.filter(p => p.subscriptionStatus === 'suspended').length,
    expired:   parents.filter(p => p.subscriptionStatus === 'expired').length,
    cancelled: parents.filter(p => p.subscriptionStatus === 'cancelled').length,
  }

  const planCounts = {
    basic:    parents.filter(p => p.subscriptionPlan === 'basic').length,
    standard: parents.filter(p => p.subscriptionPlan === 'standard').length,
    premium:  parents.filter(p => p.subscriptionPlan === 'premium').length,
    session:  parents.filter(p => (p.subscriptionPlan as string) === 'session').length,
    weekly:   parents.filter(p => (p.subscriptionPlan as string) === 'weekly').length,
    monthly:  parents.filter(p => (p.subscriptionPlan as string) === 'monthly').length,
  }

  const countryCounts: Record<string, number> = {}
  parents.forEach(p => {
    countryCounts[p.country || ''] = (countryCounts[p.country || ''] ?? 0) + 1
  })
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const catCounts: Record<string, number> = {}
  exercises.forEach(e => {
    catCounts[e.category] = (catCounts[e.category] ?? 0) + 1
  })

  const now = new Date()
  const months: { year: number; month: number; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const count = parents.filter(p => {
      const created = new Date(p.createdAt)
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth()
    }).length
    months.push({ year: d.getFullYear(), month: d.getMonth(), count })
  }

  const apptStats = {
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }

  return {
    totalClients: parents.length,
    totalExercises: exercises.length,
    totalAppointments: appointments.length,
    revenueByCurrency,
    revenueLast30dByCurrency,
    hasConfirmedPayments: confirmedPayments.length > 0,
    statusCounts,
    planCounts,
    topCountries,
    catCounts,
    months,
    apptStats,
  }
}

export default async function AnalyticsPage() {
  let data: AnalyticsData | null = null
  let error = false

  try {
    const [parents, exercises, appointments, payments] = await Promise.all([
      getAllParents(),
      getAllExercises(),
      getAllAppointments(),
      getAllPendingPayments(),
    ])
    data = computeAnalytics(parents, exercises, appointments, payments)
  } catch {
    error = true
  }

  return <AnalyticsView data={data} error={error} />
}
