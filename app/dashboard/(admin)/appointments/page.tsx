import { getAllAppointments, getAllParents } from '@/lib/db'
import { Calendar, Clock, Video, AlertCircle, CheckCircle2, XCircle, User } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ComponentType<{className?: string}> }> = {
  scheduled:  { label: 'مجدول',    color: 'bg-blue-100 text-blue-700',   icon: Clock },
  completed:  { label: 'مكتمل',   color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled:  { label: 'ملغى',    color: 'bg-red-100 text-red-700',     icon: XCircle },
  'no-show':  { label: 'لم يحضر', color: 'bg-gray-100 text-gray-600',   icon: AlertCircle },
}

const TYPE_CFG: Record<string, { label: string; color: string }> = {
  assessment: { label: 'تقييم أولي',   color: 'bg-purple-100 text-purple-700' },
  followup:   { label: 'متابعة',       color: 'bg-brand-100 text-brand-700' },
  emergency:  { label: 'استشارة عاجلة', color: 'bg-red-100 text-red-700' },
}

export default async function AppointmentsPage() {
  let appointments: Awaited<ReturnType<typeof getAllAppointments>> = []
  let parents: Awaited<ReturnType<typeof getAllParents>> = []
  let error = false

  try {
    ;[appointments, parents] = await Promise.all([getAllAppointments(), getAllParents()])
  } catch {
    error = true
  }

  const parentMap = Object.fromEntries(parents.map(p => [p.id, p]))

  const upcoming   = appointments.filter(a => a.status === 'scheduled')
  const completed  = appointments.filter(a => a.status === 'completed')
  const cancelled  = appointments.filter(a => ['cancelled', 'no-show'].includes(a.status))

  // Sort upcoming by date
  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const allSorted = [
    ...upcoming,
    ...appointments.filter(a => a.status !== 'scheduled').sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">جدول المواعيد</h1>
        <p className="text-gray-500 text-sm mt-1">إدارة جلسات المتابعة والتقييم</p>
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
          { label: 'الإجمالي',     value: appointments.length, color: 'bg-brand-50 text-brand-700',   icon: Calendar },
          { label: 'قادمة',        value: upcoming.length,    color: 'bg-blue-50 text-blue-700',     icon: Clock },
          { label: 'مكتملة',       value: completed.length,   color: 'bg-green-50 text-green-700',   icon: CheckCircle2 },
          { label: 'ملغاة / غائب', value: cancelled.length,   color: 'bg-red-50 text-red-700',       icon: XCircle },
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

      {/* Upcoming spotlight */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              المواعيد القادمة ({upcoming.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming.slice(0, 5).map((appt) => {
              const parent = parentMap[appt.parentId]
              const type = TYPE_CFG[appt.type]
              return (
                <div key={appt.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        {parent ? `${parent.firstName} ${parent.lastName}` : appt.parentId}
                      </div>
                      <div className="text-gray-500 text-xs ltr-num mt-0.5">
                        {new Date(appt.date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {' • '}{appt.timeSlot}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${type?.color}`}>
                      {type?.label}
                    </span>
                    {appt.meetingUrl && (
                      <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors">
                        <Video className="w-3 h-3" />
                        انضمام
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All appointments table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-black text-gray-900">كل المواعيد ({appointments.length})</h2>
        </div>

        {appointments.length === 0 && !error ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-gray-400 font-bold">لا توجد مواعيد بعد</p>
            <p className="text-gray-300 text-sm mt-1">ستظهر هنا عند حجز أولياء الأمور لمواعيدهم</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-right">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500">ولي الأمر</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">التاريخ والوقت</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">النوع</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">الحالة</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">الملاحظات</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">الجلسة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allSorted.map((appt) => {
                  const parent = parentMap[appt.parentId]
                  const status = STATUS_CFG[appt.status]
                  const type = TYPE_CFG[appt.type]
                  const StatusIcon = status?.icon ?? Clock
                  return (
                    <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs flex-shrink-0">
                            {parent ? parent.firstName[0] : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">
                              {parent ? `${parent.firstName} ${parent.lastName}` : '—'}
                            </div>
                            <div className="text-gray-400 text-xs">{parent?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700 font-medium ltr-num">
                          {new Date(appt.date).toLocaleDateString('ar-SA')}
                        </div>
                        <div className="text-xs text-gray-400 ltr-num">{appt.timeSlot}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${type?.color}`}>
                          {type?.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${status?.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status?.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-[200px]">
                        <p className="text-xs text-gray-500 truncate">{appt.notes || '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        {appt.meetingUrl ? (
                          <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-green-600 hover:underline">
                            <Video className="w-3 h-3" />
                            رابط
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
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
