'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import SpeakButton from '../SpeakButton'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2, Headphones, BookText, Trophy, Volume2 } from 'lucide-react'

const PURPLE = '#6B46F0'
interface Item { id: string; text: string; question: string; options: string[] }

export default function ComprehensionPage() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const [type, setType] = useState<'listening' | 'reading'>('listening')
  const [items, setItems] = useState<Item[]>([])
  const [level, setLevel] = useState('')
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [result, setResult] = useState<{ correct: boolean; answer: number; explain: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [xp, setXp] = useState(0)

  const load = useCallback(async (t: 'listening' | 'reading') => {
    setLoading(true); setIdx(0); setChosen(null); setResult(null)
    try { const r = await fetch(`/api/learner/comprehension?type=${t}`); if (r.ok) { const d = await r.json(); setItems(d.items || []); setLevel(d.level) } }
    catch { /* ignore */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { load(type) }, [type, load])

  const q = items[idx]

  async function check() {
    if (chosen === null || !q) return
    const r = await fetch('/api/learner/comprehension', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: q.id, chosen }) })
    if (r.ok) { const d = await r.json(); setResult({ correct: d.correct, answer: d.answer, explain: d.explain }); setXp(d.progress?.xp || xp) }
  }
  function next() { setChosen(null); setResult(null); setIdx(i => i + 1) }

  const done = !loading && (items.length === 0 || idx >= items.length)

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0] py-8 px-4" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <Link href="/learn" className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">{rtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} {pickLang(lang, 'بوّابتي', 'My portal', 'Mon espace')}</Link>
          <span className="text-xs font-black" style={{ color: PURPLE }}>{level}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-white rounded-2xl p-1.5 border border-slate-100">
          {([['listening', Headphones, pickLang(lang, 'استماع', 'Listening', 'Écoute')], ['reading', BookText, pickLang(lang, 'قراءة', 'Reading', 'Lecture')]] as const).map(([t, Icon, label]) => (
            <button key={t} onClick={() => setType(t as 'listening' | 'reading')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-extrabold transition ${type === t ? 'text-white' : 'text-slate-400'}`} style={type === t ? { background: PURPLE } : {}}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin" style={{ color: PURPLE }} /></div>
        ) : done ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
            <Trophy className="w-14 h-14 mx-auto mb-3" style={{ color: PURPLE }} />
            <p className="font-black text-slate-800 text-lg">{items.length === 0 ? pickLang(lang, 'لا عناصر لهذا المستوى بعد', 'None for this level yet', 'Rien pour ce niveau') : pickLang(lang, 'أحسنت! 🎉', 'Well done! 🎉', 'Bravo ! 🎉')}</p>
            {items.length > 0 && <button onClick={() => load(type)} className="mt-4 px-5 py-2.5 rounded-2xl font-bold text-sm text-white" style={{ background: PURPLE }}>{pickLang(lang, 'إعادة', 'Again', 'Recommencer')}</button>}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4"><div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(idx / items.length) * 100}%`, background: PURPLE }} /></div><span className="text-xs font-bold text-slate-400">{idx + 1}/{items.length}</span></div>

            {/* Stimulus */}
            {type === 'listening' ? (
              <div className="text-center py-4 mb-2">
                <SpeakButton text={q.text} size={40} className="w-20 h-20 rounded-full bg-violet-50" />
                <p className="text-slate-400 text-xs mt-2 flex items-center justify-center gap-1"><Volume2 className="w-3.5 h-3.5" /> {pickLang(lang, 'اضغط للاستماع ثم أجب', 'Tap to listen, then answer', 'Écoutez puis répondez')}</p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex items-start gap-2" dir="ltr">
                <p className="flex-1 text-slate-700 text-sm leading-relaxed" lang="fr">{q.text}</p>
                <SpeakButton text={q.text} size={16} />
              </div>
            )}

            <p className="font-bold text-slate-800 mb-4" dir="ltr" lang="fr">{q.question}</p>
            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                const reveal = result !== null
                const isAnswer = reveal && i === result.answer
                const isWrong = reveal && chosen === i && !result.correct
                return (
                  <button key={i} disabled={reveal} onClick={() => setChosen(i)} dir="ltr" lang="fr" className="w-full text-left px-4 py-3 rounded-2xl border-2 font-semibold text-sm transition"
                    style={isAnswer ? { borderColor: '#16a34a', background: 'rgba(22,163,74,0.08)', color: '#15803d' } : isWrong ? { borderColor: '#dc2626', background: 'rgba(220,38,38,0.06)', color: '#b91c1c' } : chosen === i ? { borderColor: PURPLE, background: 'rgba(107,70,240,0.06)', color: PURPLE } : { borderColor: '#e2e8f0', color: '#475569' }}>
                    <span className="inline-flex items-center gap-2">{isAnswer && <CheckCircle2 className="w-4 h-4" />}{isWrong && <XCircle className="w-4 h-4" />}{opt}</span>
                  </button>
                )
              })}
            </div>

            {result && <div className={`mt-4 rounded-2xl p-3 text-sm ${result.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}><p className="font-bold">{result.correct ? pickLang(lang, 'صحيح! +10 XP', 'Correct! +10 XP', 'Correct ! +10 XP') : pickLang(lang, 'ليست صحيحة', 'Not quite', 'Pas tout à fait')}</p><p className="text-xs mt-1" dir="ltr" lang="fr">{result.explain}</p></div>}

            <div className="mt-5">
              {result ? <button onClick={next} className="w-full py-3.5 rounded-2xl font-extrabold text-white text-sm" style={{ background: PURPLE }}>{idx === items.length - 1 ? pickLang(lang, 'إنهاء', 'Finish', 'Terminer') : pickLang(lang, 'التالي', 'Next', 'Suivant')}</button>
                : <button onClick={check} disabled={chosen === null} className="w-full py-3.5 rounded-2xl font-extrabold text-white text-sm disabled:opacity-40" style={{ background: PURPLE }}>{pickLang(lang, 'تحقّق', 'Check', 'Vérifier')}</button>}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
