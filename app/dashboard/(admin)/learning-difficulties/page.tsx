'use client'
import { useState, useEffect } from 'react'
import type { LearningDifficultyProfile } from '@/lib/types'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Search } from 'lucide-react'
import { staggerContainer, fadeUp, popIn, liftHover } from '@/lib/motion'
import { ACountUp } from '@/components/ui'

const SEVERITY_COLORS: Record<string, string> = {
  none:     'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200',
  mild:     'text-amber-700 bg-amber-50 ring-1 ring-amber-200',
  moderate: 'text-orange-700 bg-orange-50 ring-1 ring-orange-200',
  severe:   'text-red-700 bg-red-50 ring-1 ring-red-200',
}
const SEVERITY_LABELS: Record<string, string> = {
  none: 'طبيعي', mild: 'خفيف', moderate: 'متوسط', severe: 'شديد',
}

const LD_DOMAINS = [
  { key: 'dyslexia',       label: 'عسر القراءة',      emoji: '📖' },
  { key: 'dyscalculia',    label: 'عسر الحساب',       emoji: '🔢' },
  { key: 'dysgraphia',     label: 'عسر الكتابة',      emoji: '✍️' },
  { key: 'workingMemory',  label: 'ذاكرة العمل',      emoji: '🧩' },
  { key: 'processingSpeed',label: 'سرعة المعالجة',    emoji: '⏱️' },
]

export default function LearningDifficultiesPage() {
  const [profiles, setProfiles] = useState<LearningDifficultyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Load profiles via admin clients list
    fetch('/api/admin/clients-list')
      .then(r => r.json())
      .then(async ({ parents }) => {
        if (!parents) { setLoading(false); return }
        const profileRequests = parents.flatMap((p: { children?: { id: string }[] }) =>
          (p.children || []).map((s: { id: string }) =>
            fetch(`/api/learning-difficulties?studentId=${s.id}`)
              .then(r => r.json())
              .then(({ profile }) => profile)
              .catch(() => null)
          )
        )
        const allProfiles = (await Promise.all(profileRequests)).filter(Boolean)
        setProfiles(allProfiles)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = profiles.filter(p =>
    !search || p.studentId.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-500" />
            صعوبات التعلم
          </h1>
          <p className="text-gray-400 text-sm mt-1">ملفات صعوبات التعلم الشاملة للطلاب</p>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث..."
            className="border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
          />
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div className="grid grid-cols-3 sm:grid-cols-5 gap-3" variants={staggerContainer}>
        {LD_DOMAINS.map(d => {
          const affected = profiles.filter(p => {
            const domain = p[d.key as keyof LearningDifficultyProfile] as { severity: string } | undefined
            return domain && domain.severity !== 'none'
          }).length
          return (
            <motion.div key={d.key} variants={popIn} {...liftHover} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
              <div className="text-3xl mb-2">{d.emoji}</div>
              <div className="text-2xl font-black text-gray-900 ltr-num"><ACountUp value={affected} /></div>
              <div className="text-xs text-gray-400 mt-0.5 font-medium">{d.label}</div>
            </motion.div>
          )
        })}
      </motion.div>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }} className="bg-white rounded-3xl border border-gray-100 py-24 text-center shadow-sm">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-900 font-black text-lg">لا توجد ملفات بعد</p>
            <p className="text-gray-400 text-sm mt-1">أجر تقييم صعوبات التعلم خلال الجلسة لإنشاء ملفات</p>
          </motion.div>
        ) : (
          <motion.div key="list" className="space-y-4" variants={staggerContainer} initial="hidden" animate="show">
            {filtered.map(p => (
              <motion.div key={p.id} variants={fadeUp} {...liftHover} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 hover:border-brand-200 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">طالب #{p.studentId.slice(-6)}</h3>
                    <p className="text-gray-400 text-xs mt-0.5">آخر تحديث: <span className="ltr-num">{new Date(p.updatedAt).toLocaleDateString('fr-FR')}</span></p>
                  </div>
                  <Link href={`/dashboard/clients/${p.studentId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors">
                    عرض الملف
                  </Link>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {LD_DOMAINS.map(d => {
                    const domain = p[d.key as keyof LearningDifficultyProfile] as { severity: string; indicators: string[] }
                    const sev = domain?.severity || 'none'
                    return (
                      <div key={d.key} className={`rounded-2xl p-3 text-center ${SEVERITY_COLORS[sev]}`}>
                        <div className="text-xl mb-1">{d.emoji}</div>
                        <div className="font-black text-xs">{SEVERITY_LABELS[sev]}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{d.label}</div>
                      </div>
                    )
                  })}
                </div>

                {p.recommendations.length > 0 && (
                  <div className="mt-4 bg-brand-50 rounded-2xl p-4 border border-brand-100">
                    <h4 className="font-black text-brand-700 text-[10px] uppercase tracking-widest mb-2">التوصيات</h4>
                    <ul className="space-y-1">
                      {p.recommendations.slice(0, 3).map((r, i) => (
                        <li key={i} className="text-brand-700 text-xs flex items-start gap-2">
                          <span className="text-brand-400 mt-0.5">•</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
