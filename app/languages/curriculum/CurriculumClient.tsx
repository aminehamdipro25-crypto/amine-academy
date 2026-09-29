'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import { CEFR_DESCRIPTORS } from '@/lib/languages/placement-fr'
import { FRENCH_CURRICULUM } from '@/lib/languages/french-curriculum'
import { ChevronDown, GraduationCap, Clock, CheckCircle2, BookOpen, Languages as LangIcon, Sparkles } from 'lucide-react'

const PURPLE = '#6B46F0'
const PURPLE2 = '#9A7BFD'

export default function CurriculumClient() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const [open, setOpen] = useState<string | null>('A1')
  const [myLevel, setMyLevel] = useState<string | null>(null)

  // Read ?level=B1 (e.g. arriving from the placement result) without needing a
  // Suspense boundary for useSearchParams.
  useEffect(() => {
    try {
      const l = new URLSearchParams(window.location.search).get('level')
      if (l && FRENCH_CURRICULUM.some(c => c.level === l)) { setMyLevel(l); setOpen(l) }
    } catch { /* ignore */ }
  }, [])

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0]" dir={rtl ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#FFF8F0]/85 border-b border-black/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/languages" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}>
              <LangIcon className="w-5 h-5" />
            </div>
            <p className="font-black text-slate-800 text-sm">{pickLang(lang, 'أمين للّغات', 'Amine Languages', 'Amine Langues')}</p>
          </Link>
          <LangToggle />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-12 pb-8 text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full mb-4"
          style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE, border: '1px solid rgba(107,70,240,0.2)' }}>
          <Sparkles className="w-3.5 h-3.5" /> {pickLang(lang, 'المنهج الفرنسي', 'French Curriculum', 'Programme de français')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800">
          {pickLang(lang, 'مسار تعلّمك من A1 إلى C2', 'Your path from A1 to C2', 'Votre parcours de A1 à C2')}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
          {pickLang(lang,
            'منهج متدرّج وفق الإطار الأوروبي المرجعي — أهداف واضحة قابلة للقياس في كل مستوى، من التواصل الأساسي إلى الإتقان.',
            'A progressive CEFR curriculum — clear, measurable goals at each level, from basics to mastery.',
            'Un programme CEFR progressif — des objectifs clairs et mesurables à chaque niveau, des bases à la maîtrise.')}
        </p>
        {!myLevel && (
          <Link href="/languages/placement" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl font-extrabold text-white text-sm shadow-lg transition hover:scale-[1.03]"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
            <GraduationCap className="w-4 h-4" /> {pickLang(lang, 'اعرف مستواك أولاً', 'Find your level first', 'Trouvez d’abord votre niveau')}
          </Link>
        )}
      </section>

      {/* Levels */}
      <section className="max-w-3xl mx-auto px-4 pb-16 space-y-3">
        {FRENCH_CURRICULUM.map(lvl => {
          const d = CEFR_DESCRIPTORS[lvl.level]
          const isOpen = open === lvl.level
          const isMine = myLevel === lvl.level
          return (
            <div key={lvl.level} className={`rounded-3xl border bg-white overflow-hidden transition-shadow ${isMine ? 'shadow-md' : ''}`}
              style={{ borderColor: isMine ? PURPLE : '#eef2f7' }}>
              <button onClick={() => setOpen(isOpen ? null : lvl.level)} className="w-full flex items-center gap-4 p-5 text-start">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}>{lvl.level}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-800">{pickLang(lang, d.titleAr, d.titleEn, d.titleFr)}</p>
                    {isMine && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white" style={{ background: PURPLE }}>{pickLang(lang, 'مستواك', 'Your level', 'Votre niveau')}</span>}
                  </div>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5 line-clamp-1">{pickLang(lang, lvl.goalAr, lvl.goalEn, lvl.goalFr)}</p>
                  <p className="text-slate-400 text-[11px] mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {lvl.guidedHours}</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                  {lvl.units.map(u => (
                    <div key={u.id} className="rounded-2xl bg-slate-50/70 p-4">
                      <p className="font-black text-slate-800 text-sm flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4" style={{ color: PURPLE }} /> {pickLang(lang, u.titleAr, u.titleEn, u.titleFr)}
                      </p>
                      <ul className="space-y-1.5 mb-3">
                        {u.canDo.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: PURPLE }} />
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

        <div className="text-center pt-6">
          <Link href="/languages#enroll" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-extrabold text-white text-sm shadow-lg transition hover:scale-[1.03]"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
            <GraduationCap className="w-4 h-4" /> {pickLang(lang, 'ابدأ مع أستاذ مختصّ', 'Start with a specialist teacher', 'Commencer avec un professeur')}
          </Link>
        </div>
      </section>
    </main>
  )
}
