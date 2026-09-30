'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Check, X, RefreshCw, CheckCircle2, Tag, Save, ChevronDown } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface Pay { id: string; learnerName: string; packageName: string; sessions: number; amount: number; currency: string; method: string; status: string; createdAt: string }
interface Pkg { id: string; ar: string; en: string; fr: string; sessions: number; qar: number; tnd: number }
const cur = (c: string) => (c === 'TND' ? 'د.ت' : 'ر.ق')
const METHOD: Record<string, string> = { fawran: 'فورّان', bank: 'تحويل بنكي', whatsapp: 'واتساب' }
const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'بانتظار التأكيد', cls: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'مؤكّدة ✓', cls: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'مرفوضة', cls: 'bg-gray-100 text-gray-400' },
}

export default function LangPaymentsPage() {
  const [payments, setPayments] = useState<Pay[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pkgs, setPkgs] = useState<Pkg[]>([])
  const [showPricing, setShowPricing] = useState(false)
  const [savingPricing, setSavingPricing] = useState(false)
  const [savedPricing, setSavedPricing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [pRes, kRes] = await Promise.all([fetch('/api/admin/lang-payments'), fetch('/api/admin/lang-packages')])
      if (pRes.ok) setPayments((await pRes.json()).payments || [])
      if (kRes.ok) setPkgs((await kRes.json()).packages || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const setPkg = (id: string, field: 'qar' | 'tnd' | 'sessions', v: string) =>
    setPkgs(list => list.map(p => p.id === id ? { ...p, [field]: Number(v) || 0 } : p))
  async function savePricing() {
    setSavingPricing(true); setSavedPricing(false)
    try {
      const r = await fetch('/api/admin/lang-packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packages: pkgs }) })
      if (r.ok) { setSavedPricing(true); setTimeout(() => setSavedPricing(false), 2000); setPkgs((await r.json()).packages || pkgs) }
    } finally { setSavingPricing(false) }
  }

  async function act(id: string, action: string) {
    setBusyId(id)
    try { const r = await fetch(`/api/admin/lang-payments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }); if (r.ok) await load() }
    finally { setBusyId(null) }
  }

  const order = { pending: 0, confirmed: 1, rejected: 2 } as Record<string, number>
  const sorted = [...payments].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><CreditCard className="w-6 h-6 text-brand-500" /> مدفوعات اللغات</h1>
        <p className="text-gray-500 text-sm mt-1">أكّد طلبات الباقات بعد استلام التحويل — تُضاف الحصص لرصيد التلميذ تلقائياً.</p>
      </motion.div>

      {/* Pricing editor */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button onClick={() => setShowPricing(s => !s)} className="w-full flex items-center gap-2 px-5 py-4 text-right">
          <Tag className="w-5 h-5 text-brand-500" />
          <span className="flex-1 font-black text-gray-900 text-sm">أسعار الباقات — تحكّم كامل</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPricing ? 'rotate-180' : ''}`} />
        </button>
        {showPricing && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <div className="space-y-3">
              {pkgs.map(p => (
                <div key={p.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border border-gray-100 rounded-xl p-3">
                  <div className="sm:col-span-1"><p className="font-black text-gray-900 text-sm">{p.ar}</p></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 mb-1">عدد الحصص</label><input dir="ltr" value={p.sessions} onChange={e => setPkg(p.id, 'sessions', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 mb-1">السعر (ر.ق)</label><input dir="ltr" value={p.qar} onChange={e => setPkg(p.id, 'qar', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 mb-1">السعر (د.ت)</label><input dir="ltr" value={p.tnd} onChange={e => setPkg(p.id, 'tnd', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-[11px] text-gray-400">تظهر الأسعار فوراً في صفحة اللغات وبوّابة المتعلّم.</p>
              <button onClick={savePricing} disabled={savingPricing} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
                {savingPricing ? <RefreshCw className="w-4 h-4 animate-spin" /> : savedPricing ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {savedPricing ? 'حُفظ ✓' : 'حفظ الأسعار'}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">{[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}</div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-sm">لا طلبات دفع بعد</p></div>
        ) : sorted.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-black text-gray-900 text-sm">{p.learnerName} <span className="text-gray-400 font-normal">· {p.packageName}</span></p>
              <p className="text-xs text-gray-400">{p.amount} {cur(p.currency)} · {p.sessions} حصص · {METHOD[p.method] || p.method}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${STATUS[p.status]?.cls}`}>{STATUS[p.status]?.label || p.status}</span>
              {p.status === 'pending' && (
                <>
                  <button onClick={() => act(p.id, 'reject')} disabled={busyId === p.id} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100"><X className="w-3.5 h-3.5" /> رفض</button>
                  <button onClick={() => act(p.id, 'confirm')} disabled={busyId === p.id} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700">{busyId === p.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} تأكيد</button>
                </>
              )}
              {p.status === 'confirmed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
