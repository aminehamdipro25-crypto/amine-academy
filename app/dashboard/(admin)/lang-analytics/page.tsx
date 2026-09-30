'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, GraduationCap, Inbox, CalendarClock, TrendingUp, Coins, Clock, RefreshCw } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'

const cur = (c: string) => (c === 'TND' ? 'د.ت' : 'ر.ق')
interface Data {
  month: string
  totals: { learners: number; activeLearners: number; teachers: number; leadsNew: number; leadsConverted: number; pendingBookings: number }
  byCurrency: Record<string, { gross: number; teacher: number; academy: number; hours: number; count: number }>
  perTeacher: { name: string; hours: number; count: number; academy: number; currency: string }[]
  levels: Record<string, number>
}

export default function LangAnalyticsPage() {
  const [d, setD] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/lang-analytics'); if (r.ok) setD(await r.json()) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  if (loading || !d) return <div className="p-10 text-center text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'unknown']
  const maxLevel = Math.max(1, ...LEVELS.map(l => d.levels[l] || 0))

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-brand-500" /> تحليلات أمين للّغات</h1>
        <p className="text-gray-500 text-sm mt-1">نظرة شاملة على المتعلّمين والأساتذة والدخل — شهر {d.month}.</p>
      </motion.div>

      {/* Totals */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat icon={Users} label="المتعلّمون" value={d.totals.learners} sub={`${d.totals.activeLearners} نشط`} accent="brand" />
        <Stat icon={GraduationCap} label="الأساتذة" value={d.totals.teachers} accent="violet" />
        <Stat icon={Inbox} label="طلبات جديدة" value={d.totals.leadsNew} sub={`${d.totals.leadsConverted} محوّل`} accent="amber" />
        <Stat icon={CalendarClock} label="حجوزات معلّقة" value={d.totals.pendingBookings} accent="slate" />
      </motion.div>

      {/* Revenue by currency */}
      {Object.keys(d.byCurrency).length > 0 && (
        <motion.div variants={fadeUp} className="space-y-3">
          <h2 className="font-black text-gray-900 text-sm">دخل هذا الشهر</h2>
          {Object.entries(d.byCurrency).map(([c, v]) => (
            <div key={c} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat icon={TrendingUp} label={`دخلك (${cur(c)})`} value={`${v.academy.toLocaleString()}`} accent="brand" money />
              <Stat icon={GraduationCap} label={`مستحقّات الأساتذة (${cur(c)})`} value={`${v.teacher.toLocaleString()}`} accent="violet" money />
              <Stat icon={Coins} label={`المبيعات (${cur(c)})`} value={`${v.gross.toLocaleString()}`} accent="amber" money />
              <Stat icon={Clock} label="الساعات · الحصص" value={`${v.hours} · ${v.count}`} accent="slate" money />
            </div>
          ))}
        </motion.div>
      )}

      {/* Level distribution */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-black text-gray-900 text-sm mb-4">توزيع المستويات</h2>
        <div className="space-y-2">
          {LEVELS.filter(l => d.levels[l]).map(l => (
            <div key={l} className="flex items-center gap-3">
              <span className="w-14 text-xs font-black text-brand-600">{l === 'unknown' ? 'غير محدّد' : l}</span>
              <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-700" style={{ width: `${((d.levels[l] || 0) / maxLevel) * 100}%` }} /></div>
              <span className="w-8 text-xs font-bold text-gray-400 text-left">{d.levels[l]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Per-teacher utilisation */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-black text-gray-900 text-sm mb-4">إشغال الأساتذة (هذا الشهر)</h2>
        {d.perTeacher.length === 0 ? (
          <p className="text-gray-400 text-sm">لا حصص هذا الشهر</p>
        ) : (
          <div className="space-y-2">
            {d.perTeacher.map((t, i) => (
              <div key={i} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-700 text-white font-black text-xs flex items-center justify-center">{t.name.charAt(0)}</div><p className="font-bold text-gray-900 text-sm">{t.name}</p></div>
                <div className="flex items-center gap-3 text-xs font-bold"><span className="text-gray-500">{t.count} حصّة · {t.hours} ساعة</span><span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">لك {t.academy.toLocaleString()} {cur(t.currency)}</span></div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

const ACCENTS: Record<string, string> = { brand: 'from-brand-400 to-brand-700', violet: 'from-violet-400 to-violet-700', amber: 'from-amber-400 to-amber-600', slate: 'from-slate-400 to-slate-600' }
function Stat({ icon: Icon, label, value, sub, accent, money }: { icon: React.ElementType; label: string; value: string | number; sub?: string; accent: string; money?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ACCENTS[accent]} text-white flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div>
      <p className={`font-black text-gray-900 ${money ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="text-[11px] text-gray-400 font-bold mt-0.5">{label}{sub ? ` · ${sub}` : ''}</p>
    </div>
  )
}
