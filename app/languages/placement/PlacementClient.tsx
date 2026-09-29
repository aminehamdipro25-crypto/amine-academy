'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import {
  PLACEMENT_FR, scorePlacement, CEFR_DESCRIPTORS, CEFR_ORDER,
  type PlacementResult, type CEFRLevel,
} from '@/lib/languages/placement-fr'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, GraduationCap, Trophy, RefreshCw, BookOpen } from 'lucide-react'

const PURPLE = '#6B46F0'

export default function PlacementClient() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const Fwd = rtl ? ArrowLeft : ArrowRight

  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<PlacementResult | null>(null)

  const q = PLACEMENT_FR[idx]
  const chosen = answers[q?.id]
  const progress = Math.round((idx / PLACEMENT_FR.length) * 100)

  function pick(i: number) { setAnswers(a => ({ ...a, [q.id]: i })) }
  function next() {
    if (idx < PLACEMENT_FR.length - 1) setIdx(idx + 1)
    else setResult(scorePlacement(answers))
  }
  function restart() { setIdx(0); setAnswers({}); setResult(null) }

  if (result) return <ResultView result={result} onRestart={restart} lang={lang} rtl={rtl} />

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F0] py-8 px-4" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full"
            style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE, border: '1px solid rgba(107,70,240,0.2)' }}>
            <GraduationCap className="w-3.5 h-3.5" /> CEFR · A1 → C2
          </span>
          <h1 className="text-2xl font-black text-slate-800 mt-3">
            {pickLang(lang, 'اختبار تحديد المستوى — الفرنسيّة', 'French Placement Test', 'Test de niveau — Français')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {pickLang(lang,
              'وفق الإطار الأوروبي المرجعي المشترك للّغات — نتيجة معترف بها عالميّاً.',
              'Based on the Common European Framework — a globally recognised result.',
              'Selon le Cadre européen commun de référence — un résultat reconnu mondialement.')}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${PURPLE}, #9A7BFD)` }} />
          </div>
          <span className="text-xs font-bold text-slate-400 tabular-nums">{idx + 1}/{PLACEMENT_FR.length}</span>
        </div>

        {/* Question */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <p className="text-[11px] font-extrabold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
            {q.skill}
          </p>
          {/* The question stem is in French (we test French) — always LTR. */}
          <p className="text-xl font-bold text-slate-800 leading-relaxed mb-6" dir="ltr" lang="fr">{q.prompt}</p>

          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const active = chosen === i
              return (
                <button key={i} onClick={() => pick(i)} dir="ltr" lang="fr"
                  className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 font-semibold text-slate-700 transition-all
                    ${active ? 'shadow-sm' : 'hover:border-slate-300'}`}
                  style={active
                    ? { borderColor: PURPLE, background: 'rgba(107,70,240,0.06)', color: PURPLE }
                    : { borderColor: '#e2e8f0', background: '#fff' }}>
                  <span className="inline-flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={active ? { background: PURPLE, color: '#fff' } : { background: '#f1f5f9', color: '#94a3b8' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-7">
            <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition">
              {pickLang(lang, 'السابق', 'Back', 'Précédent')}
            </button>
            <button onClick={next} disabled={chosen === undefined}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-white text-sm transition disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
              {idx === PLACEMENT_FR.length - 1
                ? pickLang(lang, 'اعرض نتيجتي', 'See my result', 'Voir mon résultat')
                : pickLang(lang, 'التالي', 'Next', 'Suivant')}
              <Fwd className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-5">
          {pickLang(lang, 'تقييم فوري — دقيقتان فقط', 'Instant result — just 2 minutes', 'Résultat instantané — 2 minutes')}
        </p>
      </div>
    </div>
  )
}

// ── Result screen ──────────────────────────────────────────────────────────
function ResultView({ result, onRestart, lang, rtl }:
  { result: PlacementResult; onRestart: () => void; lang: 'ar' | 'en' | 'fr'; rtl: boolean }) {
  const d = CEFR_DESCRIPTORS[result.level]
  const [sent, setSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) { setErr(pickLang(lang, 'الاسم والهاتف مطلوبان', 'Name and phone required', 'Nom et téléphone requis')); return }
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/languages/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, language: 'french', level: result.level, source: 'placement',
          goal: `نتيجة تحديد المستوى: ${result.level} (${result.correct}/${result.total})`,
        }),
      })
      if (res.ok) setSent(true)
      else { const j = await res.json().catch(() => ({})); setErr(j.error || 'تعذّر الإرسال') }
    } catch { setErr(pickLang(lang, 'تعذّر الاتصال', 'Connection failed', 'Échec de connexion')) }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F0] py-10 px-4" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto">
        {/* Level badge */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center mb-5">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-4 text-white"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, #9A7BFD)` }}>
            <span className="text-4xl font-black tracking-tight">{result.level}</span>
          </div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-1">
            {pickLang(lang, 'مستواك في الفرنسيّة', 'Your French level', 'Votre niveau de français')}
          </p>
          <h1 className="text-2xl font-black text-slate-800">
            {pickLang(lang, d.titleAr, d.titleEn, d.titleFr)}
          </h1>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed max-w-lg mx-auto">
            {pickLang(lang, d.canDoAr, d.canDoEn, d.canDoFr)}
          </p>
          <div className="inline-flex items-center gap-2 mt-4 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.08)', color: '#059669' }}>
            <Trophy className="w-3.5 h-3.5" /> {result.correct}/{result.total}
          </div>
        </div>

        {/* Per-level breakdown */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-5">
          <p className="text-sm font-extrabold text-slate-700 mb-4">
            {pickLang(lang, 'تفصيل الأداء حسب المستوى', 'Performance by level', 'Détail par niveau')}
          </p>
          <div className="space-y-2.5">
            {CEFR_ORDER.map(lvl => {
              const s = result.perLevel[lvl]
              const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0
              const isLevel = lvl === result.level
              return (
                <div key={lvl} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-black" style={{ color: isLevel ? PURPLE : '#94a3b8' }}>{lvl}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: isLevel ? PURPLE : '#cbd5e1' }} />
                  </div>
                  <span className="w-10 text-xs font-bold text-slate-400 tabular-nums text-right">{s.correct}/{s.total}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Connect with a teacher */}
        {sent ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
            <CheckCircle2 className="w-14 h-14 mx-auto mb-3" style={{ color: PURPLE }} />
            <p className="font-black text-slate-800 text-lg mb-1">
              {pickLang(lang, 'تم استلام طلبك! 🎉', 'Request received! 🎉', 'Demande reçue ! 🎉')}
            </p>
            <p className="text-slate-500 text-sm">
              {pickLang(lang,
                'سيتواصل معك فريق أمين للّغات لاختيار الأستاذ المناسب وبدء خطّتك.',
                'The Amine Languages team will contact you to match you with the right teacher.',
                'L’équipe Amine Languages vous contactera pour choisir le bon professeur.')}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h3 className="font-black text-slate-800 text-lg mb-1">
              {pickLang(lang, 'ابدأ خطّتك من مستوى ' + result.level, `Start your plan at ${result.level}`, `Commencez à partir de ${result.level}`)}
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              {pickLang(lang,
                'اترك بياناتك وسنطابقك مع أستاذ فرنسيّة مختصّ يناسب مستواك وهدفك.',
                'Leave your details and we’ll match you with a specialist French teacher.',
                'Laissez vos coordonnées : nous vous mettrons en relation avec un professeur spécialisé.')}
            </p>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={pickLang(lang, 'الاسم الكامل', 'Full name', 'Nom complet')}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr"
                placeholder={pickLang(lang, 'رقم الهاتف / واتساب', 'Phone / WhatsApp', 'Téléphone / WhatsApp')}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition text-right" />
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" dir="ltr"
                placeholder={pickLang(lang, 'البريد الإلكتروني (اختياري)', 'Email (optional)', 'E-mail (optionnel)')}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition text-right" />
            </div>
            {err && <p className="text-red-500 text-xs font-bold mt-2">⚠️ {err}</p>}
            <button type="submit" disabled={saving}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-white text-sm transition disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
              {pickLang(lang, 'طابقني مع أستاذ', 'Match me with a teacher', 'Me mettre en relation')}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link href={`/languages/curriculum?level=${result.level}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-sm border-2 transition hover:bg-white"
            style={{ borderColor: 'rgba(107,70,240,0.25)', color: PURPLE }}>
            <BookOpen className="w-4 h-4" /> {pickLang(lang, 'شاهد مسار تعلّمك من هنا', 'See your learning path', 'Voir votre parcours d’apprentissage')}
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={onRestart} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition">
            <RefreshCw className="w-4 h-4" /> {pickLang(lang, 'إعادة الاختبار', 'Retake', 'Refaire')}
          </button>
          <Link href="/languages" className="text-sm font-bold" style={{ color: PURPLE }}>
            {pickLang(lang, 'أمين للّغات ←', 'Amine Languages →', 'Amine Languages →')}
          </Link>
        </div>
      </div>
    </div>
  )
}
