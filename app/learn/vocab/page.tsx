'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import { ArrowLeft, ArrowRight, Loader2, Check, X, Layers, Trophy, Sparkles } from 'lucide-react'

const PURPLE = '#6B46F0'
interface Card { id: string; fr: string; ar: string; en: string; isNew: boolean }

export default function VocabPage() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const [due, setDue] = useState<Card[]>([])
  const [mastered, setMastered] = useState(0)
  const [total, setTotal] = useState(0)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reviewed, setReviewed] = useState(0)

  const load = useCallback(async () => {
    try { const r = await fetch('/api/learner/vocab'); if (r.ok) { const d = await r.json(); setDue(d.due || []); setMastered(d.mastered || 0); setTotal(d.total || 0) } }
    catch { /* ignore */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const card = due[i]

  async function grade(correct: boolean) {
    if (!card) return
    fetch('/api/learner/vocab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wordId: card.id, correct }) }).catch(() => {})
    setReviewed(r => r + 1)
    setFlipped(false); setI(i + 1)
  }

  if (loading) return <div className="min-h-[100dvh] bg-[#FFF8F0] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: PURPLE }} /></div>

  const done = !card

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0] py-8 px-4" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <Link href="/learn" className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
            {rtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} {pickLang(lang, 'بوّابتي', 'My portal', 'Mon espace')}
          </Link>
          <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full" style={{ background: `${PURPLE}14`, color: PURPLE }}>
            <Layers className="w-3.5 h-3.5" /> {mastered}/{total} {pickLang(lang, 'مُتقن', 'mastered', 'maîtrisés')}
          </span>
        </div>

        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5" style={{ color: PURPLE }} /> {pickLang(lang, 'مراجعة المفردات', 'Vocabulary review', 'Révision du vocabulaire')}</h1>

        {done ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
            <Trophy className="w-14 h-14 mx-auto mb-3" style={{ color: PURPLE }} />
            <p className="font-black text-slate-800 text-lg mb-1">{reviewed > 0 ? pickLang(lang, `راجعت ${reviewed} كلمة 🎉`, `Reviewed ${reviewed} words 🎉`, `${reviewed} mots révisés 🎉`) : pickLang(lang, 'لا مراجعات مستحقّة الآن ✅', 'Nothing due right now ✅', 'Rien à réviser ✅')}</p>
            <p className="text-slate-500 text-sm">{pickLang(lang, 'عُد غداً لتثبيت الكلمات في ذاكرتك.', 'Come back tomorrow to lock words into memory.', 'Revenez demain pour ancrer les mots.')}</p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <Link href="/learn/practice" className="px-5 py-2.5 rounded-2xl font-bold text-sm text-white" style={{ background: PURPLE }}>{pickLang(lang, 'تمارين', 'Practice', 'Exercices')}</Link>
              <Link href="/learn" className="px-5 py-2.5 rounded-2xl font-bold text-sm border" style={{ borderColor: 'rgba(107,70,240,0.25)', color: PURPLE }}>{pickLang(lang, 'بوّابتي', 'Portal', 'Espace')}</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(i / due.length) * 100}%`, background: PURPLE }} /></div>
              <span className="text-xs font-bold text-slate-400">{i + 1}/{due.length}</span>
            </div>

            {/* Flashcard */}
            <button onClick={() => setFlipped(f => !f)} className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center min-h-[180px] flex flex-col items-center justify-center">
              {card.isNew && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white mb-2" style={{ background: PURPLE }}>{pickLang(lang, 'جديدة', 'New', 'Nouveau')}</span>}
              <p className="text-2xl font-black text-slate-800" dir="ltr" lang="fr">{card.fr}</p>
              {flipped ? (
                <p className="text-lg font-bold mt-3" style={{ color: PURPLE }}>{pickLang(lang, card.ar, card.en, `${card.en} / ${card.ar}`)}</p>
              ) : (
                <p className="text-slate-300 text-xs mt-3">{pickLang(lang, 'اضغط لإظهار المعنى', 'Tap to reveal', 'Toucher pour révéler')}</p>
              )}
            </button>

            {flipped && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => grade(false)} className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-sm border-2 border-amber-300 text-amber-700 bg-amber-50">
                  <X className="w-4 h-4" /> {pickLang(lang, 'راجعها', 'Again', 'À revoir')}
                </button>
                <button onClick={() => grade(true)} className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-sm text-white" style={{ background: '#16a34a' }}>
                  <Check className="w-4 h-4" /> {pickLang(lang, 'أعرفها', 'I know it', 'Je sais')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
