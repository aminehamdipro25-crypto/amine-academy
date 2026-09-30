'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Check, X, RefreshCw, Video, CheckCircle2 } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface Booking {
  id: string; learnerName: string; language: string; at: string; note?: string; isTrial?: boolean
  durationHours: number; price: number; currency: 'QAR' | 'TND'; link?: string; status: string
}
const LANG: Record<string, string> = { french: 'الفرنسيّة', english: 'الإنجليزيّة', spanish: 'الإسبانيّة', arabic: 'العربيّة', german: 'الألمانيّة', italian: 'الإيطاليّة' }
const STATUS: Record<string, { label: string; cls: string }> = {
  requested: { label: 'بانتظار تأكيدك', cls: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'مؤكّدة', cls: 'bg-blue-50 text-blue-700' },
  completed: { label: 'تمّت', cls: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'ملغاة', cls: 'bg-gray-100 text-gray-400' },
}
const inputCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmForm, setConfirmForm] = useState<Record<string, { price: string; durationHours: string; currency: 'QAR' | 'TND'; link: string }>>({})

  const load = useCallback(async () => {
    try { const r = await fetch('/api/teacher/bookings'); if (r.ok) setBookings((await r.json()).bookings || []) }
    catch { /* ignore */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const cf = (id: string) => confirmForm[id] || { price: '', durationHours: '1', currency: 'QAR' as const, link: '' }
  const setCf = (id: string, patch: Partial<{ price: string; durationHours: string; currency: 'QAR' | 'TND'; link: string }>) =>
    setConfirmForm(f => ({ ...f, [id]: { ...cf(id), ...patch } }))

  async function act(id: string, body: Record<string, unknown>) {
    setBusyId(id)
    try { const r = await fetch(`/api/teacher/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (r.ok) await load() }
    finally { setBusyId(null) }
  }

  const order = { requested: 0, confirmed: 1, completed: 2, cancelled: 3 } as Record<string, number>
  const sorted = [...bookings].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><CalendarClock className="w-6 h-6 text-brand-500" /> حجوزات الحصص</h1>
        <p className="text-gray-500 text-sm mt-1">أكّد طلبات تلاميذك (بالسعر والرابط)، وعند انتهاء الحصّة اضغط «تمّت» فتُسجّل في دفترك تلقائياً.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400"><CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-sm">لا حجوزات بعد</p></div>
        ) : sorted.map(b => (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 text-white font-black flex items-center justify-center">{b.learnerName.charAt(0)}</div>
                <div>
                  <p className="font-black text-gray-900 text-sm">{b.learnerName} <span className="text-gray-400 font-normal">· {LANG[b.language] || b.language}</span> {b.isTrial && <span className="text-[10px] font-black bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">🎓 تقييم</span>}</p>
                  <p className="text-xs text-gray-400">{b.at}{b.note ? ` — ${b.note}` : ''}</p>
                </div>
              </div>
              <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${STATUS[b.status]?.cls}`}>{STATUS[b.status]?.label || b.status}</span>
            </div>

            {b.status === 'requested' && (
              <div className="mt-4 bg-gray-50 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                <div><label className="block text-[11px] font-bold text-gray-500 mb-1">السعر</label><input dir="ltr" value={cf(b.id).price} onChange={e => setCf(b.id, { price: e.target.value })} className={inputCls + ' w-full'} placeholder="0" /></div>
                <div><label className="block text-[11px] font-bold text-gray-500 mb-1">العملة</label><select value={cf(b.id).currency} onChange={e => setCf(b.id, { currency: e.target.value as 'QAR' | 'TND' })} className={inputCls + ' w-full bg-white'}><option value="QAR">ر.ق</option><option value="TND">د.ت</option></select></div>
                <div><label className="block text-[11px] font-bold text-gray-500 mb-1">المدّة (ساعة)</label><input dir="ltr" value={cf(b.id).durationHours} onChange={e => setCf(b.id, { durationHours: e.target.value })} className={inputCls + ' w-full'} /></div>
                <div className="sm:col-span-1 col-span-2"><label className="block text-[11px] font-bold text-gray-500 mb-1">رابط Meet/Zoom</label><input dir="ltr" value={cf(b.id).link} onChange={e => setCf(b.id, { link: e.target.value })} className={inputCls + ' w-full'} placeholder="https://…" /></div>
                <div className="col-span-2 sm:col-span-4 flex gap-2 justify-end">
                  <button onClick={() => act(b.id, { action: 'cancel' })} disabled={busyId === b.id} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100"><X className="w-3.5 h-3.5" /> رفض</button>
                  <button onClick={() => act(b.id, { action: 'confirm', ...cf(b.id), price: Number(cf(b.id).price), durationHours: Number(cf(b.id).durationHours) })} disabled={busyId === b.id} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black text-white bg-brand-600 hover:bg-brand-700">{busyId === b.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} تأكيد</button>
                </div>
              </div>
            )}

            {b.status === 'confirmed' && (
              <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                  <span>{b.price} {b.currency === 'TND' ? 'د.ت' : 'ر.ق'} · {b.durationHours} ساعة</span>
                  {b.link && <a href={b.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600"><Video className="w-3.5 h-3.5" /> رابط الحصّة</a>}
                </div>
                <button onClick={() => act(b.id, { action: 'complete' })} disabled={busyId === b.id} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700">{busyId === b.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} تمّت الحصّة</button>
              </div>
            )}

            {b.status === 'completed' && <p className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> سُجّلت في دفتر الأرباح</p>}
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
