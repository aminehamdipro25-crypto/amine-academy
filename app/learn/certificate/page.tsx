'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import { CEFR_ORDER, CEFR_DESCRIPTORS, type CEFRLevel } from '@/lib/languages/placement-fr'
import { Award, Printer, ArrowLeft, ArrowRight, Loader2, Lock } from 'lucide-react'

const PURPLE = '#6B46F0'
const PURPLE2 = '#9A7BFD'

export default function CertificatePage() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const [name, setName] = useState('')
  const [learnerLevel, setLearnerLevel] = useState<string>('unknown')
  const [level, setLevel] = useState<CEFRLevel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const l = new URLSearchParams(window.location.search).get('level') as CEFRLevel | null
      if (l && CEFR_ORDER.includes(l)) setLevel(l)
    } catch { /* ignore */ }
    fetch('/api/learner/me').then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setName(d.learner?.name || ''); setLearnerLevel(d.learner?.level || 'unknown') })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-[100dvh] bg-[#FFF8F0] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: PURPLE }} /></div>

  const reachedIdx = CEFR_ORDER.indexOf(learnerLevel as CEFRLevel)
  const wantIdx = level ? CEFR_ORDER.indexOf(level) : -1
  const achieved = level !== null && reachedIdx >= 0 && wantIdx <= reachedIdx
  const d = level ? CEFR_DESCRIPTORS[level] : null
  const today = new Date().toLocaleDateString(rtl ? 'ar' : 'fr', { year: 'numeric', month: 'long', day: 'numeric' })

  if (!achieved) {
    return (
      <div className="min-h-[100dvh] bg-[#FFF8F0] flex flex-col items-center justify-center p-6 text-center" dir={rtl ? 'rtl' : 'ltr'}>
        <Lock className="w-12 h-12 text-slate-300 mb-3" />
        <p className="font-black text-slate-700">{pickLang(lang, 'لم تُكمل هذا المستوى بعد', 'Level not completed yet', 'Niveau non encore atteint')}</p>
        <Link href="/learn" className="mt-4 text-sm font-bold" style={{ color: PURPLE }}>{pickLang(lang, '← بوّابتي', '← My portal', '← Mon espace')}</Link>
      </div>
    )
  }

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0] py-8 px-4" dir={rtl ? 'rtl' : 'ltr'}>
      {/* toolbar — hidden when printing */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-6 print:hidden">
        <Link href="/learn" className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
          {rtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} {pickLang(lang, 'بوّابتي', 'My portal', 'Mon espace')}
        </Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-white text-sm" style={{ background: PURPLE }}>
          <Printer className="w-4 h-4" /> {pickLang(lang, 'طباعة / حفظ PDF', 'Print / Save PDF', 'Imprimer / PDF')}
        </button>
      </div>

      {/* Certificate */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden print:shadow-none print:rounded-none"
        style={{ border: `3px solid ${PURPLE}` }}>
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${PURPLE}, ${PURPLE2})` }} />
        <div className="p-10 sm:p-14 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white mb-4" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}>
            <Award className="w-8 h-8" />
          </div>
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-slate-400">{pickLang(lang, 'أمين للّغات', 'Amine Languages', 'Amine Langues')}</p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mt-3">{pickLang(lang, 'شهادة إتمام مستوى', 'Certificate of Achievement', 'Certificat de réussite')}</h1>
          <p className="text-slate-400 text-sm mt-6">{pickLang(lang, 'تشهد أكاديمية أمين بأنّ', 'This certifies that', 'Ceci atteste que')}</p>
          <p className="text-3xl font-black mt-2" style={{ color: PURPLE }}>{name}</p>
          <p className="text-slate-500 text-sm mt-5 max-w-lg mx-auto leading-relaxed">
            {pickLang(lang,
              `قد أتمّ بنجاح مستوى الفرنسيّة ${level} وفق الإطار الأوروبي المرجعي المشترك للّغات (CEFR).`,
              `has successfully completed French level ${level} of the Common European Framework (CEFR).`,
              `a complété avec succès le niveau ${level} de français selon le CECRL.`)}
          </p>

          <div className="inline-flex items-center gap-3 mt-6 px-6 py-3 rounded-2xl" style={{ background: 'rgba(107,70,240,0.06)' }}>
            <span className="text-3xl font-black" style={{ color: PURPLE }}>{level}</span>
            <div className="text-start">
              <p className="font-black text-slate-800 text-sm">{d && pickLang(lang, d.titleAr, d.titleEn, d.titleFr)}</p>
              <p className="text-slate-400 text-xs">CEFR</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100 text-sm">
            <div className="text-start">
              <p className="font-bold text-slate-700">الأستاذ أمين</p>
              <p className="text-slate-400 text-xs">{pickLang(lang, 'المدير', 'Director', 'Directeur')}</p>
            </div>
            <div className="text-end">
              <p className="font-bold text-slate-700" dir="ltr">{today}</p>
              <p className="text-slate-400 text-xs">{pickLang(lang, 'التاريخ', 'Date', 'Date')}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
