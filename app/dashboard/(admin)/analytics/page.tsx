import { getAllParents, getAllExercises, getAllAppointments } from '@/lib/db'
import { BarChart3, Users, TrendingUp, Calendar, Dumbbell, Globe, Brain, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 text-right shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-black text-gray-700 ltr-num w-8 text-left">{value}</span>
    </div>
  )
}

export default async function AnalyticsPage() {
  let parents: Awaited<ReturnType<typeof getAllParents>> = []
  let exercises: Awaited<ReturnType<typeof getAllExercises>> = []
  let appointments: Awaited<ReturnType<typeof getAllAppointments>> = []
  let error = false

  try {
    ;[parents, exercises, appointments] = await Promise.all([
      getAllParents(),
      getAllExercises(),
      getAllAppointments(),
    ])
  } catch {
    error = true
  }

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
    const label = d.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' })
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">الإحصائيات والتحليلات</h1>
        <p className="text-gray-500 text-sm mt-1">نظرة شاملة على أداء المنصة</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-amber-800 text-sm font-medium">تعذّر الاتصال بقاعدة البيانات</p>
        </div>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المشتركين',  value: parents.length,           icon: Users,      color: 'bg-brand-50 text-brand-600' },
          { label: 'اشتراكات نشطة',     value: statusCounts.active,       icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'إجمالي التمارين',   value: exercises.length,          icon: Dumbbell,   color: 'bg-purple-50 text-purple-600' },
          { label: 'جلسات مكتملة',      value: apptStats.completed,       icon: Calendar,   color: 'bg-orange-50 text-orange-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-gray-900 ltr-num">{value}</div>
            <div className="text-gray-500 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Row: Subscriptions + Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            حالة الاشتراكات
          </h2>
          <div className="space-y-3">
            <Bar label="نشط"            value={statusCounts.active}    max={parents.length} color="bg-green-500" />
            <Bar label="في الانتظار"    value={statusCounts.pending}   max={parents.length} color="bg-orange-400" />
            <Bar label="موقوف"          value={statusCounts.suspended} max={parents.length} color="bg-red-400" />
            <Bar label="منتهي الصلاحية" value={statusCounts.expired}   max={parents.length} color="bg-yellow-400" />
            <Bar label="ملغى"           value={statusCounts.cancelled} max={parents.length} color="bg-gray-300" />
          </div>
        </div>

        {/* Plan distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            توزيع الباقات
          </h2>
          <div className="space-y-4">
            {[
              { key: 'basic',    label: 'الأساسي',  color: 'bg-gray-400',    value: planCounts.basic },
              { key: 'standard', label: 'المتقدم',  color: 'bg-brand-500',   value: planCounts.standard },
              { key: 'premium',  label: 'المتميز',  color: 'bg-purple-500',  value: planCounts.premium },
            ].map(({ label, color, value }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-gray-700">{label}</span>
                  <span className="text-gray-500 ltr-num">{value} مشترك ({parents.length > 0 ? Math.round(value/parents.length*100) : 0}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`}
                    style={{ width: `${parents.length > 0 ? (value/parents.length)*100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Countries + Registration trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Countries */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-500" />
            التوزيع الجغرافي
          </h2>
          {topCountries.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">لا توجد بيانات بعد</p>
          ) : (
            <div className="space-y-3">
              {topCountries.map(([country, count]) => (
                <Bar key={country} label={country} value={count} max={parents.length} color="bg-brand-400" />
              ))}
            </div>
          )}
        </div>

        {/* Monthly registration trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            التسجيلات الشهرية (6 أشهر)
          </h2>
          <div className="flex items-end gap-2 h-32">
            {months.map(({ label, count }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-gray-700 ltr-num">{count || ''}</span>
                <div className="w-full relative">
                  <div
                    className="bg-brand-500 rounded-t-md w-full transition-all"
                    style={{ height: `${Math.max((count / maxMonthCount) * 80, count > 0 ? 8 : 0)}px` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise library breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" />
          مكتبة التمارين حسب الفئة ({exercises.length} تمرين)
        </h2>
        {exercises.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 text-sm">لم يتم تحميل التمارين بعد</p>
            <a href="/dashboard/exercises" className="text-brand-600 text-sm font-bold hover:underline mt-2 inline-block">
              اذهب إلى إدارة التمارين ←
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(CAT_LABELS).map(([key, label]) => {
              const count = catCounts[key] ?? 0
              const pct = exercises.length > 0 ? Math.round(count/exercises.length*100) : 0
              return (
                <div key={key} className="text-center bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-black text-gray-900 ltr-num">{count}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  <div className="text-xs text-gray-300 mt-0.5 ltr-num">{pct}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Appointment insights */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          إحصائيات الجلسات ({appointments.length} إجمالي)
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'مجدولة',  value: apptStats.scheduled, color: 'text-blue-600',  bg: 'bg-blue-50' },
            { label: 'مكتملة', value: apptStats.completed,  color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'ملغاة',   value: apptStats.cancelled,  color: 'text-red-600',   bg: 'bg-red-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl p-5 text-center ${bg}`}>
              <div className={`text-3xl font-black ltr-num ${color}`}>{value}</div>
              <div className="text-gray-600 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
