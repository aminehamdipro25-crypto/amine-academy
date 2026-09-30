'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import {
  Globe, GraduationCap, Users, Video, Target, TrendingUp, Award, CheckCircle2,
  Loader2, ArrowLeft, ArrowRight, Sparkles, Languages as LangIcon,
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

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0] overflow-x-hidden" dir={rtl ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#FFF8F0]/85 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}>
              <LangIcon className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="font-black text-slate-800 text-sm">{pickLang(lang, 'أمين للّغات', 'Amine Languages', 'Amine Langues')}</p>
              <p className="text-[10px] text-slate-400 font-bold tracking-wide">AMINE LANGUAGES</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/languages/teachers" className="hidden sm:inline text-xs font-bold px-3 py-2 transition" style={{ color: PURPLE }}>
              {pickLang(lang, '👩‍🏫 أساتذتنا', '👩‍🏫 Teachers', '👩‍🏫 Professeurs')}
            </Link>
            <LangToggle />
            <Link href="/" className="hidden sm:inline text-xs font-bold text-slate-400 hover:text-slate-600 transition px-3 py-2">
              {pickLang(lang, '← الأكاديمية', '← Academy', '← Académie')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.5]"
          style={{ background: `radial-gradient(circle at 20% 20%, rgba(107,70,240,0.10) 0%, transparent 45%), radial-gradient(circle at 85% 30%, rgba(154,123,253,0.10) 0%, transparent 45%)` }} />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-14 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full mb-5"
            style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE, border: '1px solid rgba(107,70,240,0.2)' }}>
            <Sparkles className="w-3.5 h-3.5" /> CEFR · A1 → C2
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-800 leading-tight">
            {pickLang(lang, 'تعلّم لغة العالم', 'Learn a world language', 'Apprenez une langue du monde')}
            <br />
            <span style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {pickLang(lang, 'بمنهجيّة عالميّة', 'the world-class way', 'avec une méthode d’excellence')}
            </span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
            {pickLang(lang,
              'دروس مباشرة مع أساتذة مختصّين، مسار شخصي وفق الإطار الأوروبي المرجعي (CEFR)، ومتابعة دقيقة للتقدّم. نبدأ بالفرنسيّة.',
              'Live lessons with specialist teachers, a personalised CEFR path, and precise progress tracking. Starting with French.',
              'Cours en direct avec des professeurs spécialisés, un parcours CEFR personnalisé et un suivi précis. Nous commençons par le français.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link href="/languages/placement"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-extrabold text-white text-sm shadow-lg transition hover:scale-[1.03]"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)`, boxShadow: '0 10px 30px rgba(107,70,240,0.25)' }}>
              <GraduationCap className="w-4 h-4" /> {pickLang(lang, 'قيّم مستواك مجاناً', 'Test your level — free', 'Testez votre niveau — gratuit')}
            </Link>
            <Link href="/languages/curriculum" className="px-6 py-4 rounded-2xl font-bold text-sm border-2 transition hover:bg-white"
              style={{ borderColor: 'rgba(107,70,240,0.25)', color: PURPLE }}>
              {pickLang(lang, 'المنهج A1–C2', 'Curriculum A1–C2', 'Programme A1–C2')}
            </Link>
            <a href="#enroll" className="px-6 py-4 rounded-2xl font-bold text-sm text-slate-500 hover:text-slate-700 transition">
              {pickLang(lang, 'سجّل اهتمامك', 'Register interest', 'S’inscrire')}
            </a>
          </div>
        </div>
      </section>

      {/* Languages grid */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-center text-2xl font-black text-slate-800 mb-2">
          {pickLang(lang, 'اللغات المتاحة', 'Available languages', 'Langues disponibles')}
        </h2>
        <p className="text-center text-slate-400 text-sm mb-8">
          {pickLang(lang, 'نبدأ بالفرنسيّة — ولغات أخرى قيد الإنشاء', 'Starting with French — more languages coming', 'Nous commençons par le français — d’autres langues arrivent')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {LANGS.map(l => (
            <div key={l.code}
              className={`relative rounded-3xl p-5 border transition-all ${l.live ? 'bg-white shadow-sm hover:shadow-md' : 'bg-white/50'}`}
              style={{ borderColor: l.live ? 'rgba(107,70,240,0.25)' : '#eef2f7' }}>
              {l.live ? (
                <span className="absolute top-3 end-3 text-[9px] font-extrabold px-2 py-0.5 rounded-full text-white" style={{ background: PURPLE }}>
                  {pickLang(lang, 'متاح', 'Live', 'Disponible')}
                </span>
              ) : (
                <span className="absolute top-3 end-3 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                  {pickLang(lang, 'قيد الإنشاء', 'Soon', 'Bientôt')}
                </span>
              )}
              <div className={`text-4xl mb-2 ${l.live ? '' : 'grayscale opacity-50'}`}>{l.flag}</div>
              <p className={`font-black text-sm ${l.live ? 'text-slate-800' : 'text-slate-400'}`}>{pickLang(lang, l.ar, l.en, l.fr)}</p>
              {l.live && (
                <Link href="/languages/placement" className="inline-flex items-center gap-1 text-xs font-bold mt-2" style={{ color: PURPLE }}>
                  {pickLang(lang, 'ابدأ', 'Start', 'Commencer')} <Fwd className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Method / pedagogy */}
      <section className="bg-white/60 border-y border-black/5 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-2xl font-black text-slate-800 mb-2">
            {pickLang(lang, 'منهجيّة بيداغوجيّة لا نظير لها', 'A pedagogy without equal', 'Une pédagogie sans égale')}
          </h2>
          <p className="text-center text-slate-400 text-sm mb-10 max-w-xl mx-auto">
            {pickLang(lang, 'مبنيّة على المعايير الدوليّة، مصمّمة حول كل متعلّم على حدة.', 'Built on international standards, designed around each learner.', 'Fondée sur les standards internationaux, conçue autour de chaque apprenant.')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Target, ar: 'تحديد المستوى بدقّة', en: 'Precise placement', fr: 'Positionnement précis', dAr: 'اختبار CEFR يحدّد مستواك A1–C2 قبل البدء.', dEn: 'A CEFR test sets your A1–C2 level before you start.', dFr: 'Un test CEFR fixe votre niveau A1–C2 avant de commencer.' },
              { icon: Users, ar: 'أساتذة مختصّون', en: 'Specialist teachers', fr: 'Professeurs spécialisés', dAr: 'أساتذة ذوو خبرة، لكل متعلّم الأنسب لمستواه وهدفه.', dEn: 'Experienced teachers matched to your level and goal.', dFr: 'Des enseignants expérimentés adaptés à votre niveau et objectif.' },
              { icon: Video, ar: 'حصص مباشرة تفاعليّة', en: 'Live interactive lessons', fr: 'Cours en direct interactifs', dAr: 'دروس مباشرة عبر المنصّة مع أدوات دعم حيّة.', dEn: 'Live lessons on the platform with in-session tools.', dFr: 'Cours en direct sur la plateforme avec des outils intégrés.' },
              { icon: TrendingUp, ar: 'متابعة التقدّم', en: 'Progress tracking', fr: 'Suivi des progrès', dAr: 'تقارير دوريّة تُظهر تطوّرك على سلّم CEFR.', dEn: 'Regular reports showing your progress on the CEFR scale.', dFr: 'Des rapports réguliers montrant votre progression CEFR.' },
              { icon: GraduationCap, ar: 'مسار شخصي', en: 'Personalised path', fr: 'Parcours personnalisé', dAr: 'خطّة مصمّمة حول أهدافك ووتيرتك.', dEn: 'A plan designed around your goals and pace.', dFr: 'Un plan conçu selon vos objectifs et votre rythme.' },
              { icon: Award, ar: 'كفاءات معترف بها', en: 'Recognised competencies', fr: 'Compétences reconnues', dAr: 'أهداف موزّعة على المهارات الأربع وفق CEFR.', dEn: 'Goals across the four skills, aligned to CEFR.', dFr: 'Objectifs sur les quatre compétences, alignés au CEFR.' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE }}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-800 text-sm">{pickLang(lang, f.ar, f.en, f.fr)}</h3>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{pickLang(lang, f.dAr, f.dEn, f.dFr)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enroll / lead form */}
      <section id="enroll" className="max-w-2xl mx-auto px-4 py-14">
        <EnrollForm lang={lang} />
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 py-8 text-center">
        <p className="text-slate-400 text-xs">
          {pickLang(lang, 'أمين للّغات — جزء من أكاديمية أمين الدوليّة', 'Amine Languages — part of Amine International Academy', 'Amine Langues — une branche de l’Académie Internationale Amine')}
        </p>
        <Link href="/" className="text-xs font-bold mt-2 inline-block" style={{ color: PURPLE }}>
          {pickLang(lang, 'العودة للأكاديمية', 'Back to the Academy', 'Retour à l’Académie')}
        </Link>
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
      const res = await fetch('/api/languages/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'landing' }),
      })
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
        <h2 className="font-black text-slate-800 text-lg">{pickLang(lang, 'سجّل اهتمامك', 'Register your interest', 'Inscrivez votre intérêt')}</h2>
      </div>
      <p className="text-slate-500 text-sm mb-5">{pickLang(lang, 'اترك بياناتك وسيتواصل معك فريق أمين للّغات.', 'Leave your details and the Amine Languages team will reach out.', 'Laissez vos coordonnées, notre équipe vous contactera.')}</p>
      <div className="space-y-3">
        <input value={form.name} onChange={e => set('name', e.target.value)}
          placeholder={pickLang(lang, 'الاسم الكامل', 'Full name', 'Nom complet')}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition" />
        <input value={form.phone} onChange={e => set('phone', e.target.value)} dir="ltr"
          placeholder={pickLang(lang, 'رقم الهاتف / واتساب', 'Phone / WhatsApp', 'Téléphone / WhatsApp')}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition text-right" />
        <input value={form.email} onChange={e => set('email', e.target.value)} type="email" dir="ltr"
          placeholder={pickLang(lang, 'البريد الإلكتروني (اختياري)', 'Email (optional)', 'E-mail (optionnel)')}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition text-right" />
        <select value={form.language} onChange={e => set('language', e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition bg-white">
          <option value="french">{pickLang(lang, 'الفرنسيّة 🇫🇷', 'French 🇫🇷', 'Français 🇫🇷')}</option>
          <option value="english">{pickLang(lang, 'الإنجليزيّة 🇬🇧 (قريباً)', 'English 🇬🇧 (soon)', 'Anglais 🇬🇧 (bientôt)')}</option>
          <option value="arabic">{pickLang(lang, 'العربيّة (قريباً)', 'Arabic (soon)', 'Arabe (bientôt)')}</option>
          <option value="spanish">{pickLang(lang, 'الإسبانيّة 🇪🇸 (قريباً)', 'Spanish 🇪🇸 (soon)', 'Espagnol 🇪🇸 (bientôt)')}</option>
          <option value="german">{pickLang(lang, 'الألمانيّة 🇩🇪 (قريباً)', 'German 🇩🇪 (soon)', 'Allemand 🇩🇪 (bientôt)')}</option>
          <option value="italian">{pickLang(lang, 'الإيطاليّة 🇮🇹 (قريباً)', 'Italian 🇮🇹 (soon)', 'Italien 🇮🇹 (bientôt)')}</option>
        </select>
        <textarea value={form.goal} onChange={e => set('goal', e.target.value)} rows={2} maxLength={400}
          placeholder={pickLang(lang, 'هدفك من تعلّم اللغة (اختياري)', 'Your goal (optional)', 'Votre objectif (optionnel)')}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-violet-400 transition resize-none" />
      </div>
      {status === 'error' && <p className="text-red-500 text-xs font-bold mt-2">⚠️ {msg}</p>}
      <button type="submit" disabled={status === 'saving'}
        className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-white text-sm transition disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
        {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
        {pickLang(lang, 'أرسل الطلب', 'Send request', 'Envoyer')}
      </button>
    </form>
  )
}
