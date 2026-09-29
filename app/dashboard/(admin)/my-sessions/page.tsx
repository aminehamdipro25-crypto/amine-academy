'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarClock, Plus, X, Trash2, RefreshCw, AlertCircle, Clock, GraduationCap, TrendingUp } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface Session {
  id: string; teacherName: string; learnerName: string; language: string
  dateISO: string; durationHours: number; price: number; currency: 'QAR' | 'TND'
  teacherSharePct: number; teacherEarn: number; status: string
}

const cur = (c: string) => (c === 'TND' ? 'د.ت' : 'ر.ق')
const LANG: Record<string, string> = { french: 'الفرنسيّة', english: 'الإنجليزيّة', spanish: 'الإسبانيّة', arabic: 'العربيّة', german: 'الألمانيّة', italian: 'الإيطاليّة' }

// Teacher-facing: log the lessons you delivered. Each session you save is
// attributed to you automatically and appears in the owner's earnings ledger
// with your share applied — you run your lessons, the accounting is automatic.
export default function MySessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ learnerName: '', language: 'french', dateISO: new Date().toISOString().slice(0, 10), durationHours: '1', price: '', currency: 'QAR' as 'QAR' | 'TND', status: 'completed' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/teaching-sessions')
      if (!res.ok) throw new Error('تعذّر التحميل')
      setSessions(await res.json()); setError('')
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.learnerName.trim() || !form.price) { setFormError('اسم التلميذ والسعر مطلوبان'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/admin/teaching-sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, durationHours: Number(form.durationHours), price: Number(form.price) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
      setForm(f => ({ ...f, learnerName: '', price: '' }))
      setShowForm(false); await load()
    } catch (e) { setFormError((e as Error).message) } finally { setSaving(false) }
  }

  async function remove(id: string) {
    setBusyId(id)
    try { const res = await fetch(`/api/admin/teaching-sessions/${id}`, { method: 'DELETE' }); if (res.ok) await load() }
    finally { setBusyId(null) }
  }

  const month = new Date().toISOString().slice(0, 7)
  const totals = useMemo(() => {
    const byCur: Record<string, { earn: number; hours: number; count: number }> = {}
    for (const s of sessions.filter(s => s.dateISO.startsWith(month))) {
      const c = (byCur[s.currency] ||= { earn: 0, hours: 0, count: 0 })
      c.earn += s.teacherEarn; c.hours += s.durationHours; c.count++
    }
    return byCur
  }, [sessions, month])

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400'

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><CalendarClock className="w-6 h-6 text-brand-500" /> حصصي</h1>
          <p className="text-gray-500 text-sm mt-1">سجّل الحصص التي قدّمتها — تُحسب مستحقّاتك تلقائياً حسب نسبتك.</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormError('') }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700">
          <Plus className="w-4 h-4" /> تسجيل حصّة
        </button>
      </motion.div>

      {error && <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-red-800 text-sm font-medium">{error}</p></div>}

      {/* My earnings this month */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.keys(totals).length === 0 ? (
          <div className="sm:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">لا حصص هذا الشهر بعد</div>
        ) : Object.entries(totals).map(([c, v]) => (
          <div key={c} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center mb-2"><TrendingUp className="w-4 h-4" /></div>
            <p className="text-xl font-black text-gray-900">{v.earn.toLocaleString()} {cur(c)}</p>
            <p className="text-[11px] text-gray-400 font-bold mt-0.5">مستحقّاتك هذا الشهر · {v.hours} ساعة · {v.count} حصّة</p>
          </div>
        ))}
      </motion.div>

      {/* Log form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="font-black text-gray-900 text-lg">تسجيل حصّة</h2><button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">اسم التلميذ</label><input value={form.learnerName} onChange={e => setForm(f => ({ ...f, learnerName: e.target.value }))} required className={inputCls} placeholder="مثال: محمد" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">اللغة</label><select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className={inputCls}>{Object.entries(LANG).map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">التاريخ</label><input type="date" value={form.dateISO} onChange={e => setForm(f => ({ ...f, dateISO: e.target.value }))} required className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">المدّة (ساعات)</label><input type="number" min="0.25" step="0.25" value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))} required className={inputCls} dir="ltr" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">سعر الحصّة</label>
                <div className="flex gap-2">
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required className={inputCls} dir="ltr" placeholder="0" />
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as 'QAR' | 'TND' }))} className="border border-gray-200 rounded-xl px-2 text-sm bg-white"><option value="QAR">ر.ق</option><option value="TND">د.ت</option></select>
                </div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">الحالة</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}><option value="completed">تمّت</option><option value="scheduled">مجدولة</option></select></div>
              {formError && <div className="md:col-span-3 text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{formError}</div>}
              <div className="md:col-span-3 flex justify-end"><button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60">{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} حفظ</button></div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My sessions list */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm"><GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />لم تسجّل أي حصّة بعد</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between flex-wrap gap-2 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-400 tabular-nums w-20">{s.dateISO}</span>
                  <div><p className="font-bold text-gray-900">{s.learnerName}</p><p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{LANG[s.language] || s.language} · {s.durationHours} ساعة · {s.status === 'completed' ? 'تمّت' : s.status === 'paid' ? 'مدفوعة' : 'مجدولة'}</p></div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-gray-500">{s.price.toLocaleString()} {cur(s.currency)}</span>
                  <span className="text-brand-600">مستحقّك {s.teacherEarn.toLocaleString()} {cur(s.currency)}</span>
                  <button onClick={() => remove(s.id)} disabled={busyId === s.id} className="text-red-400 hover:text-red-600 p-1.5 disabled:opacity-50">{busyId === s.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
