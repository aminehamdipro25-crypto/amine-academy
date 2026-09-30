'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2, Flame, Star, Trophy, Dumbbell } from 'lucide-react'

const PURPLE = '#6B46F0'
interface Ex { id: string; skill: string; prompt: string; options: string[]; done: boolean }
interface Progress { xp: number; streak: number }

export default function PracticePage() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const [exercises, setExercises] = useState<Ex[]>([])
  const [progress, setProgress] = useState<Progress>({ xp: 0, streak: 0 })
  const [level, setLevel] = useState('')
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [result, setResult] = useState<{ correct: boolean; answer: number; explain: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [finished, setFinished] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/learner/practice')
      if (r.ok) { const d = await r.json(); setExercises(d.exercises || []); setProgress(d.progress || { xp: 0, streak: 0 }); setLevel(d.level) }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const q = exercises[idx]

  async function check() {
    if (chosen === null || !q || checking) return
    setChecking(true)
    try {
      const r = await fetch('/api/learner/practice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exerciseId: q.id, chosen }) })
      if (r.ok) { const d = await r.json(); setResult({ correct: d.correct, answer: d.answer, explain: d.explain }); setProgress(d.progress) }
    } catch { /* ignore */ } finally { setChecking(false) }
  }
  function next() {
    setChosen(null); setResult(null)
    if (idx < exercises.length - 1) setIdx(idx + 1)
    else setFinished(true)
  }

  if (loading) return <Center><Loader2 className="w-8 h-8 animate-spin" style={{ color: PURPLE }} /></Center>

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0] py-8 px-4" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/learn" className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
            {rtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} {pickLang(lang, 'بوّابتي', 'My portal', 'Mon espace')}
          </Link>
          <div className="flex items-center gap-2">
            <Badge icon={Flame} color="#F97316" text={`${progress.streak}`} />
            <Badge icon={Star} color={PURPLE} text={`${progress.xp} XP`} />
          </div>
        </div>

        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4"><Dumbbell className="w-5 h-5" style={{ color: PURPLE }} /> {pickLang(lang, 'تمارين', 'Practice', 'Exercices')} · {level}</h1>

        {finished || exercises.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
            <Trophy className="w-14 h-14 mx-auto mb-3" style={{ color: PURPLE }} />
            <p className="font-black text-slate-800 text-lg mb-1">{exercises.length === 0 ? pickLang(lang, 'لا تمارين لهذا المستوى بعد', 'No exercises for this level yet', 'Pas encore d’exercices') : pickLang(lang, 'أحسنت! أنهيت الجولة 🎉', 'Well done! Round complete 🎉', 'Bravo ! Série terminée 🎉')}</p>
            <p className="text-slate-500 text-sm">{pickLang(lang, `مجموع نقاطك: ${progress.xp} XP`, `Your XP: ${progress.xp}`, `Vos XP : ${progress.xp}`)}</p>
            <div className="flex items-center justify-center gap-3 mt-5">
              {exercises.length > 0 && <button onClick={() => { setIdx(0); setFinished(false); setChosen(null); setResult(null) }} className="px-5 py-2.5 rounded-2xl font-bold text-sm text-white" style={{ background: PURPLE }}>{pickLang(lang, 'إعادة', 'Again', 'Recommencer')}</button>}
              <Link href="/learn/vocab" className="px-5 py-2.5 rounded-2xl font-bold text-sm border" style={{ borderColor: 'rgba(107,70,240,0.25)', color: PURPLE }}>{pickLang(lang, 'مراجعة المفردات', 'Vocabulary', 'Vocabulaire')}</Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(idx / exercises.length) * 100}%`, background: PURPLE }} /></div>
              <span className="text-xs font-bold text-slate-400">{idx + 1}/{exercises.length}</span>
            </div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest mb-2" style={{ color: PURPLE }}>{q.skill}</p>
            <p className="text-lg font-bold text-slate-800 mb-5" dir="ltr" lang="fr">{q.prompt}</p>
            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                const isChosen = chosen === i
                const reveal = result !== null
                const isAnswer = reveal && i === result.answer
                const isWrong = reveal && isChosen && !result.correct
                return (
                  <button key={i} disabled={reveal} onClick={() => setChosen(i)} dir="ltr" lang="fr"
                    className="w-full text-left px-4 py-3 rounded-2xl border-2 font-semibold text-sm transition"
                    style={
                      isAnswer ? { borderColor: '#16a34a', background: 'rgba(22,163,74,0.08)', color: '#15803d' }
                      : isWrong ? { borderColor: '#dc2626', background: 'rgba(220,38,38,0.06)', color: '#b91c1c' }
                      : isChosen ? { borderColor: PURPLE, background: 'rgba(107,70,240,0.06)', color: PURPLE }
                      : { borderColor: '#e2e8f0', color: '#475569' }}>
                    <span className="inline-flex items-center gap-2">
                      {isAnswer && <CheckCircle2 className="w-4 h-4" />}{isWrong && <XCircle className="w-4 h-4" />}
                      {opt}
                    </span>
                  </button>
                )
              })}
            </div>

            {result && (
              <div className={`mt-4 rounded-2xl p-3 text-sm ${result.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                <p className="font-bold">{result.correct ? pickLang(lang, 'إجابة صحيحة! +10 XP', 'Correct! +10 XP', 'Correct ! +10 XP') : pickLang(lang, 'ليست صحيحة', 'Not quite', 'Pas tout à fait')}</p>
                <p className="text-xs mt-1" dir="ltr" lang="fr">{result.explain}</p>
              </div>
            )}

            <div className="mt-5">
              {result ? (
                <button onClick={next} className="w-full py-3.5 rounded-2xl font-extrabold text-white text-sm" style={{ background: PURPLE }}>{idx === exercises.length - 1 ? pickLang(lang, 'إنهاء', 'Finish', 'Terminer') : pickLang(lang, 'التالي', 'Next', 'Suivant')}</button>
              ) : (
                <button onClick={check} disabled={chosen === null || checking} className="w-full py-3.5 rounded-2xl font-extrabold text-white text-sm disabled:opacity-40" style={{ background: PURPLE }}>{checking ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : pickLang(lang, 'تحقّق', 'Check', 'Vérifier')}</button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function Center({ children }: { children: React.ReactNode }) { return <div className="min-h-[100dvh] bg-[#FFF8F0] flex items-center justify-center">{children}</div> }
function Badge({ icon: Icon, color, text }: { icon: React.ElementType; color: string; text: string }) {
  return <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full" style={{ background: `${color}14`, color }}><Icon className="w-3.5 h-3.5" />{text}</span>
}
