'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import { LANGUAGE_PACKAGES, type LangPackage } from '@/lib/language-packages-data'
import {
  Globe, GraduationCap, Users, Video, TrendingUp, Award, CheckCircle2,
  Loader2, ArrowLeft, ArrowRight, Sparkles, Languages as LangIcon,
  Headphones, MessageCircle, BookOpen, Clock, ClipboardCheck,
} from 'lucide-react'

const PURPLE = '#6B46F0'
const PURPLE2 = '#9A7BFD'

interface LangCard { code: string; flag: string; ar: string; en: string; fr: string; live: boolean }
const LANGS: LangCard[] = [
  { code: 'french',  flag: '🇫🇷', ar: 'الفرنسيّة', en: 'French',  fr: 'Français', live: true },
  { code: 'english', flag: '🇬🇧', ar: 'الإنجليزيّة', en: 'English', fr: 'Anglais',  live: false },
  { code: 'spanish', flag: '🇪🇸', ar: 'الإسبانيّة', en: 'Spanish', fr: 'Espagnol', live: false },
  { code: 'german',  flag: '🇩🇪', ar: 'الألمانيّة', en: 'German',  fr: 'Allemand', live: false },
  { code: 'italian', flag: '🇮🇹', ar: 'الإيطاليّة', en: 'Italian', fr: 'Italien',  live: false },
  { code: 'arabic',  flag: '🇸🇦', ar: 'العربيّة',  en: 'Arabic',  fr: 'Arabe',    live: false },
]

export default function LanguagesLanding() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const Fwd = rtl ? ArrowLeft : ArrowRight
  const [curr, setCurr] = useState<'QAR' | 'TND'>('QAR')
  const sym = (c: 'QAR' | 'TND') => (c === 'TND' ? 'د.ت' : 'ر.ق')
  // Live (owner-set) prices; falls back to defaults for the first paint.
  const [packages, setPackages] = useState<LangPackage[]>(LANGUAGE_PACKAGES)
  useEffect(() => {
    fetch('/api/public/lang-packages').then(r => r.ok ? r.json() : null).then(d => { if (d?.packages?.length) setPackages(d.packages) }).catch(() => {})
  }, [])

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0] overflow-x-hidden" dir={rtl ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#FFF8F0]/85 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}><LangIcon className="w-5 h-5" /></div>
            <div className="leading-tight">
              <p className="font-black text-slate-800 text-sm">{pickLang(lang, 'أمين للّغات', 'Amine Languages', 'Amine Langues')}</p>
              <p className="text-[10px] text-slate-400 font-bold tracking-wide">AMINE LANGUAGES</p>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <a href="#pricing" className="hidden sm:inline text-xs font-bold px-3 py-2 text-slate-500 hover:text-slate-800 transition">{pickLang(lang, 'الأسعار', 'Pricing', 'Tarifs')}</a>
            <Link href="/languages/teachers" className="hidden sm:inline text-xs font-bold px-3 py-2 transition" style={{ color: PURPLE }}>{pickLang(lang, '👩‍🏫 أساتذتنا', '👩‍🏫 Teachers', '👩‍🏫 Professeurs')}</Link>
            <LangToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.5]" style={{ background: `radial-gradient(circle at 20% 20%, rgba(107,70,240,0.10) 0%, transparent 45%), radial-gradient(circle at 85% 30%, rgba(154,123,253,0.10) 0%, transparent 45%)` }} />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full mb-5" style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE, border: '1px solid rgba(107,70,240,0.2)' }}>
            <Sparkles className="w-3.5 h-3.5" /> CEFR · A1 → C2
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
            {pickLang(lang, 'أتقن الفرنسيّة', 'Master French', 'Maîtrisez le français')}<br />
            <span style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {pickLang(lang, 'مع أساتذة مختصّين ومنهجيّة عالميّة', 'with expert teachers, the world-class way', 'avec des experts, une méthode d’excellence')}
            </span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
            {pickLang(lang,
              'حصص مباشرة، تمارين تفاعليّة، شريك محادثة للتدرّب على الكلام، ومتابعة دقيقة لتقدّمك — كل ذلك في مكان واحد.',
              'Live lessons, interactive practice, a conversation partner, and precise progress tracking — all in one place.',
              'Cours en direct, exercices interactifs, partenaire de conversation et suivi précis — tout en un.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link href="/languages/placement" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-extrabold text-white text-sm shadow-lg transition hover:scale-[1.03]" style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)`, boxShadow: '0 10px 30px rgba(107,70,240,0.25)' }}>
              <GraduationCap className="w-4 h-4" /> {pickLang(lang, 'قيّم مستواك مجاناً', 'Test your level — free', 'Testez votre niveau — gratuit')}
            </Link>
            <a href="#pricing" className="px-6 py-4 rounded-2xl font-bold text-sm border-2 transition hover:bg-white" style={{ borderColor: 'rgba(107,70,240,0.25)', color: PURPLE }}>
              {pickLang(lang, 'الأسعار والباقات', 'Pricing & packages', 'Tarifs & forfaits')}
            </a>
          </div>
          {/* trust chips */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-8 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" style={{ color: PURPLE }} /> {pickLang(lang, 'وفق CEFR الأوروبي', 'CEFR-aligned', 'Aligné CEFR')}</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" style={{ color: PURPLE }} /> {pickLang(lang, 'أساتذة مختصّون', 'Expert teachers', 'Profs experts')}</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" style={{ color: PURPLE }} /> {pickLang(lang, 'حصّة تقييم قبل الالتزام', 'Trial before you commit', 'Essai avant engagement')}</span>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-4xl mx-auto px-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { v: '6', ar: 'مستويات CEFR', en: 'CEFR levels', fr: 'Niveaux CEFR' },
            { v: '4', ar: 'مهارات لغويّة', en: 'skills', fr: 'compétences' },
            { v: '24/7', ar: 'تعلّم ذاتي', en: 'self-study', fr: 'auto-apprentissage' },
            { v: '1:1', ar: 'حصص فرديّة', en: 'private lessons', fr: 'cours privés' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <p className="text-2xl font-black" style={{ color: PURPLE }}>{s.v}</p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">{pickLang(lang, s.ar, s.en, s.fr)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-center text-2xl sm:text-3xl font-black text-slate-800 mb-2">{pickLang(lang, 'ماذا تحصل عليه؟', 'What you get', 'Ce que vous obtenez')}</h2>
        <p className="text-center text-slate-400 text-sm mb-10 max-w-xl mx-auto">{pickLang(lang, 'منصّة متكاملة تجمع الحصص الحيّة والتعلّم الذاتي الذكي.', 'A complete platform blending live lessons with smart self-study.', 'Une plateforme complète : cours en direct et auto-apprentissage.')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: ClipboardCheck, ar: 'تحديد مستوى فوري', en: 'Instant placement', fr: 'Test de niveau', dAr: 'اختبار CEFR يحدّد مستواك من A1 إلى C2 في دقائق.', dEn: 'A CEFR test places you A1–C2 in minutes.', dFr: 'Un test CEFR vous situe A1–C2 en minutes.' },
            { icon: Video, ar: 'حصص مباشرة مع أستاذ', en: 'Live lessons', fr: 'Cours en direct', dAr: 'حصص فرديّة مع أستاذ مختصّ عبر Meet/Zoom.', dEn: 'Private lessons with an expert teacher.', dFr: 'Cours privés avec un professeur expert.' },
            { icon: BookOpen, ar: 'تمارين + 4 مهارات', en: 'Exercises + 4 skills', fr: 'Exercices + 4 compétences', dAr: 'قواعد ومفردات واستماع وقراءة مصحّحة فوراً.', dEn: 'Grammar, vocab, listening & reading — auto-graded.', dFr: 'Grammaire, vocab, écoute & lecture — corrigés.' },
            { icon: MessageCircle, ar: 'شريك محادثة', en: 'Conversation partner', fr: 'Partenaire de conversation', dAr: 'تدرّب على الكلام بالفرنسيّة في أي وقت.', dEn: 'Practise speaking French anytime.', dFr: 'Pratiquez l’oral quand vous voulez.' },
            { icon: Headphones, ar: 'مفردات ذكيّة + نطق', en: 'Smart vocab + audio', fr: 'Vocabulaire + audio', dAr: 'تكرار متباعد ونطق صوتي لتثبيت الكلمات.', dEn: 'Spaced repetition with audio pronunciation.', dFr: 'Répétition espacée avec audio.' },
            { icon: Award, ar: 'متابعة تقدّم + شهادات', en: 'Tracking + certificates', fr: 'Suivi + certificats', dAr: 'نقاط وسلاسل وشهادات إتمام لكل مستوى.', dEn: 'XP, streaks and completion certificates.', dFr: 'XP, séries et certificats de réussite.' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE }}><f.icon className="w-5 h-5" /></div>
              <h3 className="font-black text-slate-800 text-sm">{pickLang(lang, f.ar, f.en, f.fr)}</h3>
              <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{pickLang(lang, f.dAr, f.dEn, f.dFr)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white/60 border-y border-black/5 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-2xl sm:text-3xl font-black text-slate-800 mb-10">{pickLang(lang, 'كيف تبدأ؟', 'How it works', 'Comment commencer ?')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: '1', icon: ClipboardCheck, ar: 'قيّم مستواك', en: 'Test your level', fr: 'Testez votre niveau', dAr: 'اختبار CEFR مجاني في دقائق.', dEn: 'A free CEFR test in minutes.', dFr: 'Test CEFR gratuit.' },
              { n: '2', icon: Award, ar: 'اختر باقتك', en: 'Choose a package', fr: 'Choisissez un forfait', dAr: 'حصّة، 4، أو 8 حصص شهريّة.', dEn: 'Single, 4, or 8 lessons.', dFr: '1, 4 ou 8 cours.' },
              { n: '3', icon: Users, ar: 'تعرّف على أستاذك', en: 'Meet your teacher', fr: 'Rencontrez le prof', dAr: 'حصّة تقييم قبل الالتزام.', dEn: 'A trial before committing.', dFr: 'Un essai avant de vous engager.' },
              { n: '4', icon: TrendingUp, ar: 'ابدأ وتابع تقدّمك', en: 'Start & track', fr: 'Commencez & suivez', dAr: 'حصص + تمارين + شهادات.', dEn: 'Lessons + practice + certificates.', dFr: 'Cours + exercices + certificats.' },
            ].map((s, i) => (
              <div key={i} className="relative bg-white rounded-3xl border border-slate-100 p-6 text-center">
                <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-white font-black mb-3" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}>{s.n}</div>
                <s.icon className="w-6 h-6 mx-auto mb-2" style={{ color: PURPLE }} />
                <h3 className="font-black text-slate-800 text-sm">{pickLang(lang, s.ar, s.en, s.fr)}</h3>
                <p className="text-slate-400 text-xs mt-1">{pickLang(lang, s.dAr, s.dEn, s.dFr)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages grid */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-center text-2xl font-black text-slate-800 mb-2">{pickLang(lang, 'اللغات المتاحة', 'Available languages', 'Langues disponibles')}</h2>
        <p className="text-center text-slate-400 text-sm mb-8">{pickLang(lang, 'نبدأ بالفرنسيّة — ولغات أخرى قيد الإنشاء', 'Starting with French — more coming', 'Français d’abord — d’autres arrivent')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {LANGS.map(l => (
            <div key={l.code} className={`relative rounded-3xl p-5 border transition-all ${l.live ? 'bg-white shadow-sm hover:shadow-md' : 'bg-white/50'}`} style={{ borderColor: l.live ? 'rgba(107,70,240,0.25)' : '#eef2f7' }}>
              <span className={`absolute top-3 end-3 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${l.live ? 'text-white' : 'bg-slate-100 text-slate-400'}`} style={l.live ? { background: PURPLE } : {}}>{l.live ? pickLang(lang, 'متاح', 'Live', 'Disponible') : pickLang(lang, 'قيد الإنشاء', 'Soon', 'Bientôt')}</span>
              <div className={`text-4xl mb-2 ${l.live ? '' : 'grayscale opacity-50'}`}>{l.flag}</div>
              <p className={`font-black text-sm ${l.live ? 'text-slate-800' : 'text-slate-400'}`}>{pickLang(lang, l.ar, l.en, l.fr)}</p>
              {l.live && <Link href="/languages/placement" className="inline-flex items-center gap-1 text-xs font-bold mt-2" style={{ color: PURPLE }}>{pickLang(lang, 'ابدأ', 'Start', 'Commencer')} <Fwd className="w-3 h-3" /></Link>}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white/60 border-y border-black/5 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-2xl sm:text-3xl font-black text-slate-800 mb-2">{pickLang(lang, 'الأسعار والباقات', 'Pricing & packages', 'Tarifs & forfaits')}</h2>
          <p className="text-center text-slate-400 text-sm mb-6">{pickLang(lang, 'ادفع لما تحتاج — بلا التزام طويل.', 'Pay for what you need — no long commitment.', 'Payez ce dont vous avez besoin.')}</p>
          {/* currency toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1">
              {(['QAR', 'TND'] as const).map(c => (
                <button key={c} onClick={() => setCurr(c)} className={`text-xs font-bold px-4 py-1.5 rounded-lg transition ${curr === c ? 'text-white' : 'text-slate-400'}`} style={curr === c ? { background: PURPLE } : {}}>{sym(c)}</button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 items-stretch">
            {packages.map(p => {
              const price = curr === 'TND' ? p.tnd : p.qar
              const perLesson = Math.round(price / p.sessions)
              return (
                <div key={p.id} className={`relative rounded-3xl p-6 flex flex-col ${p.popular ? 'shadow-xl' : 'border border-slate-100 shadow-sm'}`}
                  style={p.popular ? { background: 'white', border: `2px solid ${PURPLE}` } : { background: 'white' }}>
                  {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold px-3 py-1 rounded-full text-white" style={{ background: PURPLE }}>{pickLang(lang, 'الأكثر طلباً', 'Most popular', 'Le plus choisi')}</span>}
                  <p className="font-black text-slate-800">{pickLang(lang, p.ar, p.en, p.fr)}</p>
                  <div className="my-3">
                    <span className="text-3xl font-black" style={{ color: PURPLE }}>{price}</span>
                    <span className="text-slate-400 text-sm font-bold"> {sym(curr)}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{perLesson} {sym(curr)} / {pickLang(lang, 'حصّة', 'lesson', 'cours')}</p>
                  </div>
                  <ul className="space-y-2 mb-5 text-sm text-slate-600 flex-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: PURPLE }} /> {p.sessions} {pickLang(lang, 'حصص فرديّة مباشرة', 'private live lessons', 'cours privés en direct')}</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: PURPLE }} /> {pickLang(lang, 'وصول كامل للتمارين والمحادثة', 'full access to practice & chat', 'accès complet aux exercices')}</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: PURPLE }} /> {pickLang(lang, 'متابعة تقدّم وشهادات', 'progress tracking & certificates', 'suivi & certificats')}</li>
                  </ul>
                  <a href="#enroll" className={`w-full text-center py-3 rounded-2xl font-extrabold text-sm transition ${p.popular ? 'text-white' : 'border-2'}`} style={p.popular ? { background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` } : { borderColor: 'rgba(107,70,240,0.25)', color: PURPLE }}>
                    {pickLang(lang, 'ابدأ الآن', 'Get started', 'Commencer')}
                  </a>
                </div>
              )
            })}
          </div>
          <p className="text-center text-slate-400 text-xs mt-6 flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {pickLang(lang, 'تبدأ بحصّة تقييم مجانيّة — والدفع يؤكَّد يدويّاً بعد الاتفاق.', 'Start with a free trial — payment confirmed after you agree.', 'Commencez par un essai gratuit.')}</p>
        </div>
      </section>

      {/* Teachers band */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-3xl p-8 text-center text-white" style={{ background: `linear-gradient(135deg, ${PURPLE}, #7C5CFC)` }}>
          <Users className="w-8 h-8 mx-auto mb-2" />
          <h2 className="text-2xl font-black">{pickLang(lang, 'تعرّف على أساتذتنا', 'Meet our teachers', 'Rencontrez nos profs')}</h2>
          <p className="text-white/80 text-sm mt-2 max-w-lg mx-auto">{pickLang(lang, 'اطّلع على خبراتهم وتقييماتهم قبل أن تبدأ — شفافيّة كاملة.', 'See their experience and reviews before you start — full transparency.', 'Voyez leur expérience et leurs avis — transparence totale.')}</p>
          <Link href="/languages/teachers" className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-2xl bg-white font-extrabold text-sm" style={{ color: PURPLE }}>
            {pickLang(lang, 'أساتذتنا', 'Our teachers', 'Nos professeurs')} <Fwd className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Enroll / lead form */}
      <section id="enroll" className="max-w-2xl mx-auto px-4 py-8">
        <EnrollForm lang={lang} />
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 py-8 text-center">
        <p className="text-slate-400 text-xs">{pickLang(lang, 'أمين للّغات — جزء من أكاديمية أمين الدوليّة', 'Amine Languages — part of Amine International Academy', 'Amine Langues — une branche de l’Académie Internationale Amine')}</p>
        <Link href="/" className="text-xs font-bold mt-2 inline-block" style={{ color: PURPLE }}>{pickLang(lang, 'العودة للأكاديمية', 'Back to the Academy', 'Retour à l’Académie')}</Link>
      </footer>
    </main>
  )
}

function EnrollForm({ lang }: { lang: 'ar' | 'en' | 'fr' }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', language: 'french', goal: '' })
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) { setStatus('error'); setMsg(pickLang(lang, 'الاسم والهاتف مطلوبان', 'Name and phone required', 'Nom et téléphone requis')); return }
    setStatus('saving'); setMsg('')
    try {
      const res = await fetch('/api/languages/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, source: 'landing' }) })
      if (res.ok) setStatus('done')
      else { const j = await res.json().catch(() => ({})); setStatus('error'); setMsg(j.error || 'تعذّر الإرسال') }
    } catch { setStatus('error'); setMsg(pickLang(lang, 'تعذّر الاتصال', 'Connection failed', 'Échec de connexion')) }
  }

  if (status === 'done') return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
      <CheckCircle2 className="w-14 h-14 mx-auto mb-3" style={{ color: PURPLE }} />
      <p className="font-black text-slate-800 text-lg mb-1">{pickLang(lang, 'تم استلام طلبك! 🎉', 'Request received! 🎉', 'Demande reçue ! 🎉')}</p>
      <p className="text-slate-500 text-sm">{pickLang(lang, 'سنتواصل معك قريباً لبدء رحلتك في تعلّم اللغة.', 'We’ll contact you soon to start your language journey.', 'Nous vous contacterons bientôt pour démarrer.')}</p>
    </div>
  )

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-1">
        <Globe className="w-5 h-5" style={{ color: PURPLE }} />
        <h2 className="font-black text-slate-800 text-lg">{pickLang(lang, 'ابدأ رحلتك — سجّل اهتمامك', 'Start your journey — register interest', 'Commencez — inscrivez-vous')}</h2>
      </div>
      <p className="text-slate-500 text-sm mb-5">{pickLang(lang, 'اترك بياناتك وسيتواصل معك فريق أمين للّغات لحجز حصّة التقييم.', 'Leave your details and we’ll reach out to book your trial.', 'Laissez vos coordonnées pour réserver votre essai.')}</p>
      <div className="space-y-3">
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={pickLang(lang, 'الاسم الكامل', 'Full name', 'Nom complet')} className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition" />
        <input value={form.phone} onChange={e => set('phone', e.target.value)} dir="ltr" placeholder={pickLang(lang, 'رقم الهاتف / واتساب', 'Phone / WhatsApp', 'Téléphone / WhatsApp')} className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition text-right" />
        <input value={form.email} onChange={e => set('email', e.target.value)} type="email" dir="ltr" placeholder={pickLang(lang, 'البريد الإلكتروني (اختياري)', 'Email (optional)', 'E-mail (optionnel)')} className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition text-right" />
        <select value={form.language} onChange={e => set('language', e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition bg-white">
          <option value="french">{pickLang(lang, 'الفرنسيّة 🇫🇷', 'French 🇫🇷', 'Français 🇫🇷')}</option>
          <option value="english">{pickLang(lang, 'الإنجليزيّة 🇬🇧 (قريباً)', 'English 🇬🇧 (soon)', 'Anglais 🇬🇧 (bientôt)')}</option>
          <option value="arabic">{pickLang(lang, 'العربيّة (قريباً)', 'Arabic (soon)', 'Arabe (bientôt)')}</option>
          <option value="spanish">{pickLang(lang, 'الإسبانيّة 🇪🇸 (قريباً)', 'Spanish 🇪🇸 (soon)', 'Espagnol 🇪🇸 (bientôt)')}</option>
          <option value="german">{pickLang(lang, 'الألمانيّة 🇩🇪 (قريباً)', 'German 🇩🇪 (soon)', 'Allemand 🇩🇪 (bientôt)')}</option>
          <option value="italian">{pickLang(lang, 'الإيطاليّة 🇮🇹 (قريباً)', 'Italian 🇮🇹 (soon)', 'Italien 🇮🇹 (bientôt)')}</option>
        </select>
        <textarea value={form.goal} onChange={e => set('goal', e.target.value)} rows={2} maxLength={400} placeholder={pickLang(lang, 'هدفك من تعلّم اللغة (اختياري)', 'Your goal (optional)', 'Votre objectif (optionnel)')} className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition resize-none" />
      </div>
      {status === 'error' && <p className="text-red-500 text-xs font-bold mt-2">⚠️ {msg}</p>}
      <button type="submit" disabled={status === 'saving'} className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-white text-sm transition disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
        {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
        {pickLang(lang, 'أرسل الطلب', 'Send request', 'Envoyer')}
      </button>
    </form>
  )
}
