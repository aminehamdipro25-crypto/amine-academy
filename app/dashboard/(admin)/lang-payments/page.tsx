'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Check, X, RefreshCw, CheckCircle2 } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface Pay { id: string; learnerName: string; packageName: string; sessions: number; amount: number; currency: string; method: string; status: string; createdAt: string }
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

  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/lang-payments'); if (r.ok) setPayments((await r.json()).payments || []) }
    catch { /* ignore */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

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
