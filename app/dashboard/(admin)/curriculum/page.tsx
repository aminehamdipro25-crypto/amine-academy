'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, ChevronDown, Clock, CheckCircle2, BookOpen, Target, Lightbulb } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { useLang, pickLang } from '@/lib/i18n'
import { CEFR_DESCRIPTORS } from '@/lib/languages/placement-fr'
import { FRENCH_CURRICULUM } from '@/lib/languages/french-curriculum'

// Teacher-facing syllabus / lesson-planning reference for the French track.
// Staff-accessible (not owner-only): every language teacher can consult it.
export default function TeacherCurriculumPage() {
  const { lang } = useLang()
  const [open, setOpen] = useState<string | null>('A1')

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-brand-500" /> دليل التدريس — الفرنسيّة (CEFR)
        </h1>
        <p className="text-gray-500 text-sm mt-1">مرجع بيداغوجي للأساتذة: أهداف كل مستوى، القواعد والمفردات المطلوب تغطيتها، من A1 إلى C2.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-2 bg-brand-50/60 border border-brand-100 rounded-2xl px-4 py-3 text-sm text-brand-800">
        <Lightbulb className="w-4 h-4 flex-shrink-0" />
        نهج مقترح: ابدأ كل حصّة بمراجعة سريعة، قدّم هدفاً واحداً واضحاً (can-do)، درّب المهارات الأربع (استماع/كلام/قراءة/كتابة)، واختم بمهمّة تطبيقيّة تُقيّم الهدف.
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {FRENCH_CURRICULUM.map(lvl => {
          const d = CEFR_DESCRIPTORS[lvl.level]
          const isOpen = open === lvl.level
          return (
            <div key={lvl.level} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : lvl.level)} className="w-full flex items-center gap-4 p-4 text-right">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white font-black flex items-center justify-center flex-shrink-0">{lvl.level}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900">{pickLang(lang, d.titleAr, d.titleEn, d.titleFr)}</p>
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{pickLang(lang, lvl.goalAr, lvl.goalEn, lvl.goalFr)}</p>
                </div>
                <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1 flex-shrink-0"><Clock className="w-3 h-3" />{lvl.guidedHours}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4 grid gap-3 md:grid-cols-2">
                  {lvl.units.map(u => (
                    <div key={u.id} className="rounded-xl border border-gray-100 p-4">
                      <p className="font-black text-gray-900 text-sm flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-brand-500" /> {pickLang(lang, u.titleAr, u.titleEn, u.titleFr)}
                      </p>
                      <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1"><Target className="w-3 h-3" /> الأهداف</p>
                      <ul className="space-y-1 mb-3">
                        {u.canDo.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                            {pickLang(lang, c.ar, c.en, c.fr)}
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-1.5" dir="ltr">
                        {u.grammar.map(g => <span key={g} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{g}</span>)}
                        {u.vocab.map(v => <span key={v} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{v}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
