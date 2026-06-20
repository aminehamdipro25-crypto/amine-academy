import { getAllParents, getAllExercises, getAllAppointments, getAllPendingPayments } from '@/lib/db'
import { BarChart3, Users, TrendingUp, Calendar, Dumbbell, Globe, Brain, AlertCircle, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 font-medium w-28 text-right shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-black text-gray-800 ltr-num w-8 text-left">{value}</span>
    </div>
  )
}

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

  // ── Revenue (confirmed payments only) ───────────────────────
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

  // ── Subscription breakdown ──────────────────────────────────
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
  }

  // ── Country distribution ────────────────────────────────────
  const countryCounts: Record<string, number> = {}
  parents.forEach(p => {
    const c = p.country || 'غير محدد'
    countryCounts[c] = (countryCounts[c] ?? 0) + 1
  })
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  // ── Exercise category breakdown ─────────────────────────────
  const catCounts: Record<string, number> = {}
  exercises.forEach(e => {
    catCounts[e.category] = (catCounts[e.category] ?? 0) + 1
  })

  const CAT_LABELS: Record<string, string> = {
    motor:   'حركي',
    focus:   'تركيز',
    balance: 'توازن',
    energy:  'طاقة',
    sensory: 'حسي',
    social:  'اجتماعي',
  }

  // ── Monthly registrations (last 6 months) ──────────────────
  const now = new Date()
  const months: Array<{ label: string; count: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    const count = parents.filter(p => {
      const created = new Date(p.createdAt)
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth()
    }).length
    months.push({ label, count })
  }
  const maxMonthCount = Math.max(...months.map(m => m.count), 1)

  // ── Appointment stats ───────────────────────────────────────
  const apptStats = {
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-500" />
          الإحصائيات والتحليلات
        </h1>
        <p className="text-gray-400 text-sm mt-1">نظرة شاملة على أداء المنصة</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">تعذّر الاتصال بقاعدة البيانات</p>
        </div>
      )}

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي المشتركين', value: parents.length,      bg: 'bg-brand-600',   glow: 'shadow-brand-500/20',   icon: Users },
          { label: 'اشتراكات نشطة',    value: statusCounts.active, bg: 'bg-emerald-600', glow: 'shadow-emerald-500/20', icon: TrendingUp },
          { label: 'إجمالي التمارين',  value: exercises.length,    bg: 'bg-violet-600',  glow: 'shadow-violet-500/20',  icon: Dumbbell },
          { label: 'جلسات مكتملة',     value: apptStats.completed, bg: 'bg-orange-500',  glow: 'shadow-orange-500/20',  icon: Calendar },
        ].map(({ label, value, bg, glow, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shadow-lg ${glow} mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-black text-gray-900 ltr-num">{value}</div>
            <div className="text-gray-400 text-xs mt-0.5 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Revenue ── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          الإيرادات (الدفعات المؤكدة فقط)
        </h2>
        {confirmedPayments.length === 0 ? (
          <p className="text-gray-300 text-sm text-center py-4">لا توجد دفعات مؤكدة بعد</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(revenueByCurrency).map(([currency, total]) => (
              <div key={`total-${currency}`} className="bg-emerald-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-emerald-700 ltr-num">{total.toLocaleString('en-US')}</div>
                <div className="text-emerald-600 text-xs mt-0.5 font-bold">{currency} — إجمالي</div>
              </div>
            ))}
            {Object.entries(revenueLast30dByCurrency).map(([currency, total]) => (
              <div key={`30d-${currency}`} className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-gray-800 ltr-num">{total.toLocaleString('en-US')}</div>
                <div className="text-gray-400 text-xs mt-0.5 font-bold">{currency} — آخر 30 يوم</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Subscriptions + Plans ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            حالة الاشتراكات
          </h2>
          <div className="space-y-3.5">
            <Bar label="نشط"            value={statusCounts.active}    max={parents.length} color="bg-emerald-500" />
            <Bar label="في الانتظار"    value={statusCounts.pending}   max={parents.length} color="bg-amber-400" />
            <Bar label="موقوف"          value={statusCounts.suspended} max={parents.length} color="bg-red-400" />
            <Bar label="منتهي الصلاحية" value={statusCounts.expired}   max={parents.length} color="bg-orange-400" />
            <Bar label="ملغى"           value={statusCounts.cancelled} max={parents.length} color="bg-gray-300" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-violet-500" />
            توزيع الباقات
          </h2>
          <div className="space-y-4">
            {[
              { key: 'basic',    label: 'الأساسي',    color: 'bg-gray-400',    value: planCounts.basic },
              { key: 'standard', label: 'القياسي',    color: 'bg-brand-500',   value: planCounts.standard },
              { key: 'premium',  label: 'المتميز',    color: 'bg-violet-500',  value: planCounts.premium },
              { key: 'session',  label: 'حصة مفردة',  color: 'bg-teal-500',    value: parents.filter(p => (p.subscriptionPlan as string) === 'session').length },
              { key: 'weekly',   label: 'أسبوعي',     color: 'bg-blue-400',    value: parents.filter(p => (p.subscriptionPlan as string) === 'weekly').length },
              { key: 'monthly',  label: 'شهري',       color: 'bg-emerald-500', value: parents.filter(p => (p.subscriptionPlan as string) === 'monthly').length },
            ].filter(x => x.value > 0).map(({ label, color, value }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-gray-700">{label}</span>
                  <span className="text-gray-400 ltr-num">{value} ({parents.length > 0 ? Math.round(value/parents.length*100) : 0}%)</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all`}
                    style={{ width: `${parents.length > 0 ? (value/parents.length)*100 : 0}%` }} />
                </div>
              </div>
            ))}
            {parents.length === 0 && (
              <p className="text-gray-300 text-sm text-center py-4">لا توجد بيانات بعد</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Countries + Monthly trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-emerald-500" />
            التوزيع الجغرافي
          </h2>
          {topCountries.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">لا توجد بيانات بعد</p>
          ) : (
            <div className="space-y-3.5">
              {topCountries.map(([country, count]) => (
                <Bar key={country} label={country} value={count} max={parents.length} color="bg-brand-400" />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-orange-500" />
            التسجيلات الشهرية (6 أشهر)
          </h2>
          <div className="flex items-end gap-2 h-36">
            {months.map(({ label, count }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-black text-gray-700 ltr-num">{count || ''}</span>
                <div className="w-full">
                  <div
                    className="bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-lg w-full transition-all"
                    style={{ height: `${Math.max((count / maxMonthCount) * 90, count > 0 ? 8 : 2)}px` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Exercise breakdown ── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-violet-500" />
          مكتبة التمارين ({exercises.length} تمرين)
        </h2>
        {exercises.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 text-sm">لم يتم تحميل التمارين بعد</p>
            <a href="/dashboard/exercises" className="text-brand-600 text-sm font-bold hover:underline mt-2 inline-block">
              اذهب إلى إدارة التمارين →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(CAT_LABELS).map(([key, label]) => {
              const count = catCounts[key] ?? 0
              const pct = exercises.length > 0 ? Math.round(count/exercises.length*100) : 0
              return (
                <div key={key} className="text-center bg-gray-50 rounded-2xl p-4 hover:bg-brand-50 transition-colors">
                  <div className="text-2xl font-black text-gray-900 ltr-num">{count}</div>
                  <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
                  <div className="text-[10px] text-gray-300 mt-0.5 ltr-num">{pct}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Sessions ── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-blue-500" />
          الجلسات ({appointments.length} إجمالي)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'مجدولة',  value: apptStats.scheduled, bg: 'bg-blue-600',    glow: 'shadow-blue-500/20' },
            { label: 'مكتملة',  value: apptStats.completed, bg: 'bg-emerald-600', glow: 'shadow-emerald-500/20' },
            { label: 'ملغاة',   value: apptStats.cancelled, bg: 'bg-red-500',     glow: 'shadow-red-500/20' },
          ].map(({ label, value, bg, glow }) => (
            <div key={label} className="bg-gray-50 rounded-2xl p-5 text-center hover:shadow-md transition-shadow">
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center shadow-lg ${glow} mb-3 mx-auto`}>
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="text-3xl font-black text-gray-900 ltr-num">{value}</div>
              <div className="text-gray-400 text-xs mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>
        {(apptStats.completed + apptStats.cancelled) > 0 && (
          <p className="text-gray-400 text-xs mt-4 text-center">
            نسبة الإلغاء:{' '}
            <span className="font-black text-gray-700 ltr-num">
              {Math.round(apptStats.cancelled / (apptStats.completed + apptStats.cancelled) * 100)}%
            </span>{' '}
            من الجلسات المنتهية (مكتملة + ملغاة)
          </p>
        )}
      </div>
    </div>
  )
}
