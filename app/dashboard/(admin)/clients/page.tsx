import { getAllParents } from '@/lib/db'
import { Users, Search, CheckCircle, Clock, XCircle, AlertCircle, Phone, Mail, MapPin } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:    { label: 'نشط',            color: 'bg-green-100 text-green-700' },
  pending:   { label: 'في الانتظار',    color: 'bg-orange-100 text-orange-700' },
  suspended: { label: 'موقوف',          color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'ملغى',           color: 'bg-gray-100 text-gray-600' },
  expired:   { label: 'منتهي الصلاحية', color: 'bg-yellow-100 text-yellow-700' },
}

const PLAN_LABELS: Record<string, string> = {
  basic:    'أساسي',
  standard: 'قياسي',
  premium:  'مميز',
}

export default async function ClientsPage() {
  let parents: Awaited<ReturnType<typeof getAllParents>> = []
  let error = false

  try {
    parents = await getAllParents()
  } catch {
    error = true
  }

  const activeCount  = parents.filter(p => p.subscriptionStatus === 'active').length
  const pendingCount = parents.filter(p => p.subscriptionStatus === 'pending').length
  const suspendedCount = parents.filter(p => ['suspended', 'cancelled', 'expired'].includes(p.subscriptionStatus)).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">إدارة المشتركين</h1>
          <p className="text-gray-500 text-sm mt-1">قائمة جميع أولياء الأمور المسجلين</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
        >
          + إضافة مشترك
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-amber-800 text-sm font-medium">تعذّر الاتصال بقاعدة البيانات</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'الإجمالي',         value: parents.length, color: 'bg-brand-50 text-brand-700',  icon: Users },
          { label: 'نشط',              value: activeCount,    color: 'bg-green-50 text-green-700',  icon: CheckCircle },
          { label: 'في الانتظار',      value: pendingCount,   color: 'bg-orange-50 text-orange-700',icon: Clock },
          { label: 'موقوف / منتهي',    value: suspendedCount, color: 'bg-red-50 text-red-700',      icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900 ltr-num">{value}</div>
              <div className="text-gray-500 text-xs">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm">قائمة المشتركين ({parents.length})</span>
        </div>

        {parents.length === 0 && !error ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-gray-400 font-medium">لا يوجد مشتركون بعد</p>
            <p className="text-gray-300 text-sm mt-1">ستظهر هنا عند تسجيل أول ولي أمر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-right">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">ولي الأمر</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">التواصل</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">البلد</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">الباقة</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">الأطفال</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">تاريخ التسجيل</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parents.map((parent) => {
                  const status = STATUS_CONFIG[parent.subscriptionStatus] ?? { label: parent.subscriptionStatus, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={parent.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-black text-sm flex-shrink-0">
                            {parent.firstName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{parent.firstName} {parent.lastName}</div>
                            <div className="text-gray-400 text-xs ltr-num">{parent.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {parent.email}
                          </div>
                          {parent.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 ltr-num">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {parent.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {parent.country || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700 font-medium">{PLAN_LABELS[parent.subscriptionPlan] || parent.subscriptionPlan}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-bold text-gray-700 ltr-num">{parent.childrenIds?.length ?? 0}</span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500 ltr-num">
                        {new Date(parent.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/dashboard/clients/${parent.id}`}
                          className="text-brand-600 text-xs font-bold hover:underline"
                        >
                          عرض
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
