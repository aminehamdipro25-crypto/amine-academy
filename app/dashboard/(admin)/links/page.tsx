'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link2, Copy, ExternalLink, Check, Share2, Globe, GraduationCap, Puzzle, LayoutDashboard } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface Row { label: string; path?: string; url?: string; note?: string }
interface Group { title: string; icon: React.ElementType; share?: boolean; rows: Row[] }

const GROUPS: Group[] = [
  {
    title: 'اللغات — روابط عامّة (شاركها مع العملاء)', icon: Globe, share: true,
    rows: [
      { label: 'الصفحة التسويقيّة', path: '/languages' },
      { label: 'اختبار تحديد المستوى (طُعم تسويقي)', path: '/languages/placement' },
      { label: 'المنهج A1–C2', path: '/languages/curriculum' },
      { label: 'أساتذتنا (البورتفوليو)', path: '/languages/teachers' },
    ],
  },
  {
    title: 'بوّابة المتعلّم', icon: GraduationCap, share: true,
    rows: [
      { label: 'دخول المتعلّم', path: '/learn/login' },
    ],
  },
  {
    title: 'قسم الأطفال', icon: Puzzle, share: true,
    rows: [
      { label: 'البوّابة من موقعك (هديّة + تعريف)', url: 'https://amine-fit.com/academy' },
      { label: 'المنصّة العلاجيّة', path: '/' },
      { label: 'تسجيل طفل جديد', path: '/register' },
      { label: 'دخول الأولياء', path: '/parent/login' },
      { label: 'العرض التجريبي', path: '/demo' },
    ],
  },
  {
    title: 'إدارتك (للمالك والأساتذة)', icon: LayoutDashboard,
    rows: [
      { label: 'دخول لوحة التحكّم (مالك / فريق عمل)', path: '/dashboard/login' },
      { label: 'متعلّمو اللغات', path: '/dashboard/learners' },
      { label: 'مدفوعات اللغات + الأسعار', path: '/dashboard/lang-payments' },
      { label: 'تحليلات اللغات', path: '/dashboard/lang-analytics' },
      { label: 'دفتر الأرباح', path: '/dashboard/earnings' },
    ],
  },
]

export default function LinksPage() {
  const [origin, setOrigin] = useState('https://academy.amine-fit.com')
  const [copied, setCopied] = useState<string | null>(null)
  useEffect(() => { if (typeof window !== 'undefined') setOrigin(window.location.origin) }, [])

  const full = (r: Row) => r.url || `${origin}${r.path}`
  function copy(r: Row) {
    const url = full(r)
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(url); setTimeout(() => setCopied(null), 1500)
  }

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Link2 className="w-6 h-6 text-brand-500" /> روابط ومشاركة</h1>
        <p className="text-gray-500 text-sm mt-1">كل روابط المنصّة في مكان واحد — انسخ أي رابط وشاركه مع عميلك بنقرة.</p>
      </motion.div>

      {GROUPS.map((g, gi) => (
        <motion.div key={gi} variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
            <g.icon className="w-4 h-4 text-brand-500" />
            <h2 className="font-black text-gray-900 text-sm flex-1">{g.title}</h2>
            {g.share && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><Share2 className="w-3 h-3" /> قابلة للمشاركة</span>}
          </div>
          <div className="divide-y divide-gray-50">
            {g.rows.map((r, ri) => {
              const url = full(r)
              return (
                <div key={ri} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm">{r.label}</p>
                    <p className="text-xs text-gray-400 truncate" dir="ltr">{url}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => copy(r)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${copied === url ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      {copied === url ? <><Check className="w-3.5 h-3.5" /> نُسخ</> : <><Copy className="w-3.5 h-3.5" /> نسخ</>}
                    </button>
                    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 transition">
                      <ExternalLink className="w-3.5 h-3.5" /> فتح
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      ))}

      <motion.div variants={fadeUp} className="bg-brand-50/60 border border-brand-100 rounded-2xl px-4 py-3 text-xs text-brand-800">
        💡 لمشاركة عبر واتساب: اضغط «نسخ» ثم الصق الرابط في المحادثة. اختبار تحديد المستوى هو أفضل رابط للتسويق — يجذب العميل ويعرّفه بمستواه.
      </motion.div>
    </motion.div>
  )
}
