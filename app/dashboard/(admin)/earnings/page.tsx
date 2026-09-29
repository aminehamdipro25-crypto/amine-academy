'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, Plus, X, Trash2, RefreshCw, AlertCircle, Clock, Users,
  TrendingUp, GraduationCap, Percent, CalendarDays, Coins,
} from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface Teacher { id: string; name: string; role?: string; languages?: string[]; teacherSharePct?: number; currency?: 'QAR' | 'TND' }
interface Session {
  id: string; teacherId: string; teacherName: string; learnerName: string; language: string
  dateISO: string; durationHours: number; price: number; currency: 'QAR' | 'TND'
  teacherSharePct: number; teacherEarn: number; academyEarn: number; status: string; note?: string
}

const cur = (c: string) => (c === 'TND' ? 'د.ت' : 'ر.ق')
const thisMonth = () => new Date().toISOString().slice(0, 7)
const LANG_LABEL: Record<string, string> = { french: 'الفرنسيّة', english: 'الإنجليزيّة', spanish: 'الإسبانيّة', arabic: 'العربيّة', german: 'الألمانيّة', italian: 'الإيطاليّة' }

export default function EarningsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [month, setMonth] = useState(thisMonth())

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ teacherId: '', learnerName: '', language: 'french', dateISO: new Date().toISOString().slice(0, 10), durationHours: '1', price: '', currency: 'QAR' as 'QAR' | 'TND', status: 'completed', teacherSharePct: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, sRes] = await Promise.all([fetch('/api/admin/staff'), fetch('/api/admin/teaching-sessions')])
      if (!tRes.ok || !sRes.ok) throw new Error('تعذّر التحميل')
      const allStaff: Teacher[] = await tRes.json()
      setTeachers(allStaff.filter(s => s.role === 'language_teacher'))
      setSessions(await sRes.json())
      setError('')
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // When a teacher is picked, prefill share % and currency from their profile.
  function pickTeacher(id: string) {
    const t = teachers.find(x => x.id === id)
    setForm(f => ({
      ...f, teacherId: id,
      teacherSharePct: t?.teacherSharePct != null ? String(t.teacherSharePct) : f.teacherSharePct,
      currency: t?.currency || f.currency,
    }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.teacherId || !form.learnerName.trim() || !form.price) {
      setFormError('الأستاذ واسم المتعلّم والسعر مطلوبة'); return
    }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/admin/teaching-sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, durationHours: Number(form.durationHours), price: Number(form.price) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
      setForm(f => ({ ...f, learnerName: '', price: '', note: '' }))
      setShowForm(false)
      await load()
    } catch (e) { setFormError((e as Error).message) } finally { setSaving(false) }
  }

  async function remove(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/teaching-sessions/${id}`, { method: 'DELETE' })
      if (res.ok) await load()
    } finally { setBusyId(null) }
  }

  const monthly = useMemo(() => sessions.filter(s => s.dateISO.startsWith(month)), [sessions, month])

  // Aggregate per currency (never sum across currencies) and per teacher.
  const totals = useMemo(() => {
    const byCur: Record<string, { gross: number; teacher: number; academy: number; hours: number; count: number }> = {}
    const byTeacher: Record<string, { name: string; currency: string; gross: number; teacher: number; academy: number; hours: number; count: number }> = {}
    for (const s of monthly) {
      const c = (byCur[s.currency] ||= { gross: 0, teacher: 0, academy: 0, hours: 0, count: 0 })
      c.gross += s.price; c.teacher += s.teacherEarn; c.academy += s.academyEarn; c.hours += s.durationHours; c.count++
      const tk = `${s.teacherId}|${s.currency}`
      const t = (byTeacher[tk] ||= { name: s.teacherName, currency: s.currency, gross: 0, teacher: 0, academy: 0, hours: 0, count: 0 })
      t.gross += s.price; t.teacher += s.teacherEarn; t.academy += s.academyEarn; t.hours += s.durationHours; t.count++
    }
    return { byCur, byTeacher: Object.values(byTeacher).sort((a, b) => b.academy - a.academy) }
  }, [monthly])

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand-500" /> دفتر الأرباح — أمين للّغات
          </h1>
          <p className="text-gray-500 text-sm mt-1">ساعات الأساتذة ودخلهم ونصيبك من كل حصّة — تلقائياً حسب نسبة كل أستاذ.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="text-sm font-bold text-gray-700 outline-none bg-transparent" />
          </div>
          <button onClick={() => { setShowForm(true); setFormError('') }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors">
            <Plus className="w-4 h-4" /> تسجيل حصّة
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500" /><p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* KPI totals (per currency) */}
      <motion.div variants={fadeUp} className="space-y-3">
        {Object.keys(totals.byCur).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">لا حصص مسجّلة في هذا الشهر — سجّل أول حصّة لتظهر الأرباح</p>
          </div>
        ) : Object.entries(totals.byCur).map(([c, v]) => (
          <div key={c} className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Kpi icon={TrendingUp} label={`دخلك (الأكاديمية) — ${cur(c)}`} value={`${v.academy.toLocaleString()} ${cur(c)}`} accent="brand" big />
            <Kpi icon={GraduationCap} label={`مستحقّات الأساتذة — ${cur(c)}`} value={`${v.teacher.toLocaleString()} ${cur(c)}`} accent="violet" />
            <Kpi icon={Coins} label={`إجمالي المبيعات — ${cur(c)}`} value={`${v.gross.toLocaleString()} ${cur(c)}`} accent="amber" />
            <Kpi icon={Clock} label="مجموع الساعات" value={`${v.hours} ساعة`} accent="slate" />
            <Kpi icon={Users} label="عدد الحصص" value={`${v.count}`} accent="slate" />
          </div>
        ))}
      </motion.div>

      {/* Log form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900 text-lg">تسجيل حصّة</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {teachers.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                لا يوجد أساتذة لغات بعد — أضِف أستاذاً من صفحة «فريق العمل» أولاً.
              </p>
            ) : (
              <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="الأستاذ">
                  <select value={form.teacherId} onChange={e => pickTeacher(e.target.value)} required className={inputCls}>
                    <option value="">— اختر —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}{t.teacherSharePct != null ? ` (${t.teacherSharePct}%)` : ''}</option>)}
                  </select>
                </Field>
                <Field label="اسم المتعلّم">
                  <input value={form.learnerName} onChange={e => setForm(f => ({ ...f, learnerName: e.target.value }))} required className={inputCls} placeholder="مثال: محمد" />
                </Field>
                <Field label="اللغة">
                  <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className={inputCls}>
                    {Object.entries(LANG_LABEL).map(([c, l]) => <option key={c} value={c}>{l}</option>)}
                  </select>
                </Field>
                <Field label="التاريخ">
                  <input type="date" value={form.dateISO} onChange={e => setForm(f => ({ ...f, dateISO: e.target.value }))} required className={inputCls} />
                </Field>
                <Field label="المدّة (ساعات)">
                  <input type="number" min="0.25" step="0.25" value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))} required className={inputCls} dir="ltr" />
                </Field>
                <Field label="سعر الحصّة">
                  <div className="flex gap-2">
                    <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required className={inputCls} dir="ltr" placeholder="0" />
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as 'QAR' | 'TND' }))} className="border border-gray-200 rounded-xl px-2 text-sm bg-white">
                      <option value="QAR">ر.ق</option><option value="TND">د.ت</option>
                    </select>
                  </div>
                </Field>
                <Field label="نسبة الأستاذ %">
                  <input type="number" min="0" max="100" value={form.teacherSharePct} onChange={e => setForm(f => ({ ...f, teacherSharePct: e.target.value }))} className={inputCls} dir="ltr" placeholder="من ملف الأستاذ" />
                </Field>
                <Field label="الحالة">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    <option value="completed">تمّت</option>
                    <option value="scheduled">مجدولة</option>
                    <option value="paid">مدفوعة</option>
                  </select>
                </Field>
                {/* Live split preview */}
                <div className="md:col-span-3 flex items-center gap-4 text-xs bg-gray-50 rounded-xl px-4 py-3">
                  {(() => {
                    const price = Number(form.price) || 0
                    const pct = Number(form.teacherSharePct) || 0
                    const teacher = Math.round(price * pct / 100)
                    return (
                      <>
                        <span className="font-bold text-violet-700 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> للأستاذ: {teacher.toLocaleString()} {cur(form.currency)}</span>
                        <span className="font-bold text-brand-600 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> لك: {(price - teacher).toLocaleString()} {cur(form.currency)}</span>
                      </>
                    )
                  })()}
                </div>
                {formError && <div className="md:col-span-3 text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{formError}</div>}
                <div className="md:col-span-3 flex justify-end">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} حفظ الحصّة
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Per-teacher breakdown */}
      {totals.byTeacher.length > 0 && (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-violet-500" /> حسب الأستاذ</h2>
          <div className="space-y-2">
            {totals.byTeacher.map((t, i) => (
              <div key={i} className="flex items-center justify-between flex-wrap gap-2 border border-gray-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 text-white font-black text-sm flex items-center justify-center">{t.name.charAt(0)}</div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.count} حصّة · {t.hours} ساعة</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">مبيعات {t.gross.toLocaleString()} {cur(t.currency)}</span>
                  <span className="bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">للأستاذ {t.teacher.toLocaleString()} {cur(t.currency)}</span>
                  <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">لك {t.academy.toLocaleString()} {cur(t.currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sessions list */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-black text-gray-900 text-sm">حصص شهر {month}</h2></div>
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div>
        ) : monthly.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">لا حصص في هذا الشهر</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {monthly.map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between flex-wrap gap-2 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-400 tabular-nums w-20">{s.dateISO}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{s.teacherName} <span className="text-gray-400 font-normal">← {s.learnerName}</span></p>
                    <p className="text-xs text-gray-400">{LANG_LABEL[s.language] || s.language} · {s.durationHours} ساعة · {statusLabel(s.status)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-gray-500">{s.price.toLocaleString()} {cur(s.currency)}</span>
                  <span className="text-violet-600 flex items-center gap-0.5"><Percent className="w-3 h-3" />{s.teacherSharePct}</span>
                  <span className="text-brand-600">لك {s.academyEarn.toLocaleString()}</span>
                  <button onClick={() => remove(s.id)} disabled={busyId === s.id} className="text-red-400 hover:text-red-600 p-1.5 disabled:opacity-50">
                    {busyId === s.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>{children}</div>
}
function statusLabel(s: string) { return s === 'paid' ? 'مدفوعة ✓' : s === 'scheduled' ? 'مجدولة' : 'تمّت' }

const ACCENTS: Record<string, string> = {
  brand: 'from-brand-400 to-brand-700', violet: 'from-violet-400 to-violet-700',
  amber: 'from-amber-400 to-amber-600', slate: 'from-slate-400 to-slate-600',
}
function Kpi({ icon: Icon, label, value, accent, big }: { icon: React.ElementType; label: string; value: string; accent: string; big?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${big ? 'border-brand-200 bg-brand-50/40' : 'border-gray-100 bg-white'}`}>
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ACCENTS[accent]} text-white flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div>
      <p className={`font-black text-gray-900 ${big ? 'text-xl' : 'text-lg'}`}>{value}</p>
      <p className="text-[11px] text-gray-400 font-bold mt-0.5">{label}</p>
    </div>
  )
}
