'use client'
import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Banknote, FileText, LineChart, Map as MapIcon, MapPin, MessageCircle, Package, Pencil, Phone, Plus, Search, Users } from 'lucide-react'
import {
  clientBalances, formatDuration, formatMoney, lessonsCount, packageNeedsRenewal, packageStatus, phoneDigits, renewalText,
  type ClientBalance, type WorkClient, type WorkLesson,
} from '@/lib/worklog'
import { clientLabel, useWorkLog } from './useWorkLog'
import { NavLinks } from './WorkMap'
import StatementSheet from './StatementSheet'
import ProgressSheet from './ProgressSheet'
import { Empty, Segmented, ghostBtn, inputCls, localToday, primaryBtn, shortDate } from './ui'

const StopsMap = dynamic(() => import('./WorkMap').then(m => m.StopsMap), {
  ssr: false, loading: () => <div className="h-72 rounded-2xl bg-gray-100 animate-pulse" />,
})

type Filter = 'active' | 'owes' | 'archived'

export default function ClientsView({ onAdd, onEdit, onPay, onAddLesson, onEditLesson }: {
  onAdd: () => void; onEdit: (c: WorkClient) => void; onPay: (clientId: string) => void; onAddLesson: (clientId: string) => void
  onEditLesson: (l: WorkLesson) => void
}) {
  const { clients, lessons, payments, settings } = useWorkLog()
  const [filter, setFilter] = useState<Filter>('active')
  const [q, setQ] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [statementFor, setStatementFor] = useState<WorkClient | null>(null)
  const [progressFor, setProgressFor] = useState<WorkClient | null>(null)
  const today = localToday()

  const balances = useMemo(
    () => new Map(clientBalances(clients, lessons, payments, today).map(b => [b.clientId, b])),
    [clients, lessons, payments, today],
  )
  const nextLesson = useMemo(() => {
    const m = new Map<string, string>()
    for (const l of lessons) {
      if (l.status !== 'scheduled' || l.date < today) continue
      const key = `${l.date} ${l.start}`
      if (!m.has(l.clientId) || key < m.get(l.clientId)!) m.set(l.clientId, key)
    }
    return m
  }, [lessons, today])
  const doneMinutes = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of lessons) if (l.status === 'done') m.set(l.clientId, (m.get(l.clientId) ?? 0) + l.durationMin)
    return m
  }, [lessons])

  const list = clients
    .filter(c => (filter === 'archived' ? c.archived : !c.archived))
    .filter(c => filter !== 'owes' || (balances.get(c.id)?.balance ?? 0) > 0)
    .filter(c => !q.trim() || `${c.name} ${c.childName ?? ''} ${c.phone ?? ''} ${c.address ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (balances.get(b.id)?.balance ?? 0) - (balances.get(a.id)?.balance ?? 0) || a.name.localeCompare(b.name, 'ar'))

  const totalOwed = [...balances.values()].reduce((s, b) => s + Math.max(0, b.balance), 0)
  const owingCount = [...balances.values()].filter(b => b.balance > 0).length
  const located = clients.filter(c => !c.archived && c.location)

  if (!clients.length) {
    return (
      <Empty icon={<Users className="w-5 h-5" />} title="لا عائلات بعد"
        text="أضف كل عائلة مرة واحدة: سعر الساعة، الهاتف، وموقع المنزل على الخريطة — وبعدها تصبح إضافة الحصص بنقرتين."
        action={<button onClick={onAdd} className={primaryBtn()}><Plus className="w-4 h-4" /> إضافة عائلة</button>} />
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-l from-brand-600 to-brand-800 p-5 text-white shadow-lg shadow-brand-200">
        <p className="text-xs font-bold text-brand-100">مستحقات لم تُستلم بعد</p>
        <p className="text-3xl font-black mt-1">{formatMoney(totalOwed, settings.currency)}</p>
        <p className="text-[11px] text-brand-100 mt-1">{owingCount ? `لدى ${owingCount} من ${clients.filter(c => !c.archived).length} عائلة` : 'كل العائلات مسدّدة'} · محسوبة من الحصص المنجزة ناقص الدفعات</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input className={`${inputCls} pr-9`} value={q} onChange={e => setQ(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو العنوان" aria-label="بحث" />
        </div>
        <div className="flex items-center gap-2">
          <Segmented size="sm" value={filter} onChange={setFilter}
            options={[{ value: 'active', label: 'الكل' }, { value: 'owes', label: 'عليها مستحقات' }, { value: 'archived', label: 'مؤرشفة' }]} />
          {located.length > 0 && (
            <button onClick={() => setShowMap(s => !s)} className={ghostBtn(showMap ? 'bg-gray-100' : '')} aria-pressed={showMap}>
              <MapIcon className="w-4 h-4" /><span className="hidden sm:inline">الخريطة</span>
            </button>
          )}
          <button onClick={onAdd} className={primaryBtn()}><Plus className="w-4 h-4" /><span className="hidden sm:inline">عائلة</span></button>
        </div>
      </div>

      {showMap && (
        <StopsMap height="h-72" currency={settings.currency}
          stops={located.map(c => ({ id: c.id, point: c.location!, color: c.color, title: clientLabel(c) }))} />
      )}

      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">لا نتائج</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((c, i) => {
            const b = balances.get(c.id)!
            const tel = phoneDigits(c.phone, settings.currency)
            const next = nextLesson.get(c.id)
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black flex-shrink-0" style={{ backgroundColor: c.color }}>
                    {(c.childName || c.name).charAt(0)}
                  </span>
                  <button onClick={() => onEdit(c)} className="flex-1 min-w-0 text-right">
                    <p className="font-black text-gray-900 truncate">{c.childName || c.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{c.childName ? c.name + ' · ' : ''}{formatMoney(c.hourlyRate, settings.currency)} / ساعة</p>
                  </button>
                  {!c.archived && (
                    <button onClick={() => onAddLesson(c.id)} className="inline-flex items-center gap-1 h-8 rounded-lg bg-brand-50 px-2 text-[11px] font-bold text-brand-700" aria-label="حصة جديدة لهذه العائلة">
                      <Plus className="w-3.5 h-3.5" /> حصة
                    </button>
                  )}
                  <button onClick={() => onEdit(c)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400" aria-label="تعديل"><Pencil className="w-3.5 h-3.5" /></button>
                </div>

                <div className={`rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 ${b.balance > 0 ? 'bg-amber-50' : b.balance < 0 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold ${b.balance > 0 ? 'text-amber-700' : b.balance < 0 ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {b.balance > 0 ? 'مستحق عليها' : b.balance < 0 ? 'دفعت مسبقاً (رصيد لها)' : b.billed > 0 ? 'مسدّدة بالكامل ✓' : 'لا شيء مستحق بعد'}
                    </p>
                    <p className="font-black text-gray-900">{formatMoney(Math.abs(b.balance), settings.currency)}</p>
                    <p className="text-[10px] text-gray-500">{paymentLine(b)}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => onPay(c.id)} className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-white border border-gray-200 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-gray-800 hover:border-brand-300">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" /> استلمت مبلغاً
                    </button>
                    <button onClick={() => setStatementFor(c)} className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-white border border-gray-200 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-gray-800 hover:border-brand-300">
                      <FileText className="w-3.5 h-3.5 text-brand-600" /> كشف حساب
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                  <span>{formatDuration(doneMinutes.get(c.id) ?? 0)} منجزة</span>
                  <span>{next ? `القادمة: ${shortDate(next.slice(0, 10))} ${next.slice(11)}` : 'لا حصة قادمة'}</span>
                  {b.unconfirmed > 0 && <span className="text-amber-700 font-bold">{b.unconfirmed} بلا حالة</span>}
                </div>

                {(() => {
                  const pk = packageStatus(c.id, lessons, payments)
                  if (!pk) return null
                  const low = packageNeedsRenewal(pk)
                  return (
                    <div className={`rounded-xl px-3 py-2 flex items-center justify-between gap-2 ${low ? 'bg-rose-50 border border-rose-100' : 'bg-brand-50'}`}>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold inline-flex items-center gap-1 ${low ? 'text-rose-700' : 'text-brand-800'}`}>
                          <Package className="w-3.5 h-3.5" /> باقة {pk.covered} حصص
                        </p>
                        <p className="text-[11px] text-gray-600">
                          {pk.remaining > 0 ? `بقيت ${lessonsCount(pk.remaining)} من ${pk.covered}` : pk.remaining === 0 ? 'انتهت الباقة' : `تجاوزت الباقة بـ${lessonsCount(-pk.remaining)}`}
                        </p>
                        <div className="mt-1 h-1.5 w-32 rounded-full bg-white overflow-hidden">
                          <div className={`h-full ${low ? 'bg-rose-500' : 'bg-brand-500'}`} style={{ width: `${Math.min(100, (pk.used / pk.covered) * 100)}%` }} />
                        </div>
                      </div>
                      {low && (
                        <a href={`https://wa.me/${phoneDigits(c.phone, settings.currency) ?? ''}?text=${encodeURIComponent(renewalText(c, pk))}`} target="_blank" rel="noopener noreferrer"
                          className="whitespace-nowrap inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white">
                          <MessageCircle className="w-3.5 h-3.5" /> اطلب التجديد
                        </a>
                      )}
                    </div>
                  )
                })()}

                {c.address && <p className="text-[11px] text-gray-500 inline-flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />{c.address}</p>}

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button onClick={() => setProgressFor(c)} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 font-bold text-amber-800">
                    <LineChart className="w-3.5 h-3.5" /> سجل التقدّم
                  </button>
                  {c.location ? <NavLinks point={c.location} compact /> : (
                    <button onClick={() => onEdit(c)} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2 py-1 font-bold text-gray-500">
                      <MapPin className="w-3.5 h-3.5" /> حدّد الموقع
                    </button>
                  )}
                  {tel && (
                    <>
                      <a href={`tel:+${tel}`} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 font-bold text-gray-700"><Phone className="w-3.5 h-3.5" /> اتصال</a>
                      <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700"><MessageCircle className="w-3.5 h-3.5" /> واتساب</a>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      <StatementSheet client={statementFor} onClose={() => setStatementFor(null)} />
      <ProgressSheet client={progressFor} onClose={() => setProgressFor(null)} onEditLesson={onEditLesson} />
    </div>
  )
}

/**
 * The small line under a family's balance, in plain words. "دفعة" alone read
 * as a verb («دفعت؟») to the person using it — so every case says what
 * happened and what is left, rather than a noun to decode.
 */
function paymentLine(b: ClientBalance): string {
  const unpaid = b.balance > 0 && b.lessonsSinceLastPayment ? lessonsCount(b.lessonsSinceLastPayment) : ''
  if (!b.lastPaymentDate) {
    if (b.billed === 0) return 'لا حصص منجزة بعد'
    return unpaid ? `لم تدفع أي مبلغ بعد · ${unpaid} غير مدفوعة` : 'لم تدفع أي مبلغ بعد'
  }
  const last = `آخر مبلغ استلمته منها ${shortDate(b.lastPaymentDate)}`
  return unpaid ? `${last} · ${unpaid} بعده` : last
}
