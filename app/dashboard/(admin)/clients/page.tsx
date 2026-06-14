import { getAllParents } from '@/lib/db'
import { Users, CheckCircle, Clock, XCircle, AlertCircle, Phone, Mail, MapPin, UserPlus, ChevronLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STATUS: Record<string, { label: string; dot: string; badge: string }> = {
  active:    { label: 'نشط',            dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700 ring-1 ring-green-200' },
  pending:   { label: 'في الانتظار',    dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  suspended: { label: 'موقوف',          dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700 ring-1 ring-red-200' },
  cancelled: { label: 'ملغى',           dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' },
  expired:   { label: 'منتهي',          dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' },
}

const PLAN_LABELS: Record<string, string> = {
  basic: 'أساسي', standard: 'قياسي', premium: 'مميز',
  session: 'حصة مفردة', weekly: 'أسبوعي', monthly: 'شهري',
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
]

export default async function ClientsPage() {
  let parents: Awaited<ReturnType<typeof getAllParents>> = []
  let error = false

  try {
    parents = await getAllParents()
  } catch {
    error = true
  }

  const activeCount    = parents.filter(p => p.subscriptionStatus === 'active').length
  const pendingCount   = parents.filter(p => p.subscriptionStatus === 'pending').length
  const inactiveCount  = parents.filter(p => ['suspended','cancelled','expired'].includes(p.subscriptionStatus)).length
  const sortedParents  = [...parents].reverse()

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-500" />
            المشتركون
          </h1>
          <p className="text-gray-400 text-sm mt-1">{parents.length} ولي أمر مسجّل في المنصة</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-brand-500/20 hover:shadow-md hover:shadow-brand-500/30"
        >
          <UserPlus className="w-4 h-4" />
          إضافة مشترك
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">تعذّر الاتصال بقاعدة البيانات</p>
        </div>
      )}

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي المشتركين', value: parents.length, icon: Users,        bg: 'bg-brand-600',  glow: 'shadow-brand-500/20' },
          { label: 'نشطون',            value: activeCount,    icon: CheckCircle,  bg: 'bg-emerald-600',glow: 'shadow-emerald-500/20' },
          { label: 'في الانتظار',      value: pendingCount,   icon: Clock,        bg: 'bg-amber-500',  glow: 'shadow-amber-500/20' },
          { label: 'غير نشطين',        value: inactiveCount,  icon: XCircle,      bg: 'bg-gray-500',   glow: 'shadow-gray-500/20' },
        ].map(({ label, value, icon: Icon, bg, glow }) => (
          <div key={label} className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shadow-lg ${glow} mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-black text-gray-900 ltr-num">{value}</div>
            <div className="text-gray-400 text-xs mt-0.5 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Client Cards ── */}
      {sortedParents.length === 0 && !error ? (
        <div className="bg-white rounded-3xl border border-gray-100 py-24 text-center shadow-sm">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-gray-900 font-black text-lg">لا يوجد مشتركون بعد</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">ستظهر هنا عند تسجيل أول ولي أمر</p>
          <Link href="/dashboard/clients/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
            <UserPlus className="w-4 h-4" />
            إضافة مشترك الآن
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedParents.map((parent, idx) => {
            const status = STATUS[parent.subscriptionStatus] ?? { label: parent.subscriptionStatus, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' }
            const gradient = AVATAR_COLORS[idx % AVATAR_COLORS.length]
            const plan = PLAN_LABELS[parent.subscriptionPlan] || parent.subscriptionPlan
            const joinDate = new Date(parent.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
            const childCount = parent.childrenIds?.length ?? 0
            const expiringIn7 = parent.subscriptionExpiry
              ? (new Date(parent.subscriptionExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7
                && parent.subscriptionStatus === 'active'
              : false

            return (
              <Link
                key={parent.id}
                href={`/dashboard/clients/${parent.id}`}
                className="group bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:border-brand-200 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0`}>
                      {parent.firstName?.[0]?.toUpperCase() ?? '?'}
                      {/* online dot */}
                      <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 ${status.dot} rounded-full border-2 border-white`} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm group-hover:text-brand-600 transition-colors">
                        {parent.firstName} {parent.lastName}
                      </p>
                      <p className="text-gray-400 text-[11px] mt-0.5 font-mono ltr-num truncate max-w-[140px]">
                        {parent.id.slice(0, 20)}…
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${status.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    {expiringIn7 && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 ring-1 ring-amber-200 px-2 py-0.5 rounded-full text-[10px] font-black">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        ينتهي قريباً
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    <span className="truncate">{parent.email}</span>
                  </div>
                  {parent.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      <span className="ltr-num">{parent.phone}</span>
                    </div>
                  )}
                  {parent.country && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      <span>{parent.country}</span>
                    </div>
                  )}
                </div>

                {/* Footer strip */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-medium">الباقة</p>
                      <p className="text-xs font-black text-gray-700 mt-0.5">{plan || '—'}</p>
                    </div>
                    <div className="w-px h-6 bg-gray-100" />
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-medium">الأطفال</p>
                      <p className="text-xs font-black text-gray-700 mt-0.5 ltr-num">{childCount}</p>
                    </div>
                    <div className="w-px h-6 bg-gray-100" />
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-medium">التسجيل</p>
                      <p className="text-xs font-black text-gray-700 mt-0.5 ltr-num">{joinDate}</p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-xl bg-gray-50 group-hover:bg-brand-50 flex items-center justify-center transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}
