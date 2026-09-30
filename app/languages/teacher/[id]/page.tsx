'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useLang, pickLang } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import { Languages as LangIcon, Award, GraduationCap, BookOpen, Sparkles, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'

const PURPLE = '#6B46F0'
const PURPLE2 = '#9A7BFD'
interface T { id: string; name: string; headline: string; bio: string; experienceYears: number | null; certifications: string; approach: string; languages: string[] }
const LANG: Record<string, { ar: string; en: string; fr: string; flag: string }> = {
  french: { ar: 'الفرنسيّة', en: 'French', fr: 'Français', flag: '🇫🇷' }, english: { ar: 'الإنجليزيّة', en: 'English', fr: 'Anglais', flag: '🇬🇧' },
  spanish: { ar: 'الإسبانيّة', en: 'Spanish', fr: 'Espagnol', flag: '🇪🇸' }, arabic: { ar: 'العربيّة', en: 'Arabic', fr: 'Arabe', flag: '🇸🇦' },
  german: { ar: 'الألمانيّة', en: 'German', fr: 'Allemand', flag: '🇩🇪' }, italian: { ar: 'الإيطاليّة', en: 'Italian', fr: 'Italien', flag: '🇮🇹' },
}

export default function TeacherProfile() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const Fwd = rtl ? ArrowLeft : ArrowRight
  const params = useParams()
  const id = params?.id as string
  const [t, setT] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/public/teachers/${id}`).then(r => r.ok ? r.json() : Promise.reject()).then(setT).catch(() => setT(null)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-[100dvh] bg-[#FFF8F0] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: PURPLE }} /></div>
  if (!t) return (
    <div className="min-h-[100dvh] bg-[#FFF8F0] flex flex-col items-center justify-center p-6 text-center">
      <p className="font-black text-slate-700">{pickLang(lang, 'هذا الملف غير متاح', 'Profile not available', 'Profil indisponible')}</p>
      <Link href="/languages/teachers" className="mt-3 text-sm font-bold" style={{ color: PURPLE }}>{pickLang(lang, 'كل الأساتذة', 'All teachers', 'Tous les professeurs')}</Link>
    </div>
  )

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
      <h2 className="font-black text-slate-800 flex items-center gap-2 mb-2"><Icon className="w-4 h-4" style={{ color: PURPLE }} /> {title}</h2>
      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{children}</p>
    </div>
  )

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0]" dir={rtl ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-40 backdrop-blur bg-[#FFF8F0]/85 border-b border-black/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/languages/teachers" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600">
            {rtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} {pickLang(lang, 'الأساتذة', 'Teachers', 'Professeurs')}
          </Link>
          <LangToggle />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* Hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white font-black text-3xl mb-3" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}>{t.name.charAt(0)}</div>
          <h1 className="text-2xl font-black text-slate-800">{t.name}</h1>
          {t.headline && <p className="text-slate-500 text-sm mt-1">{t.headline}</p>}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            {t.experienceYears != null && <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE }}><Award className="w-3.5 h-3.5" /> {t.experienceYears}+ {pickLang(lang, 'سنوات', 'yrs', 'ans')}</span>}
            {t.languages.map(l => <span key={l} className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-50 text-slate-600">{LANG[l]?.flag} {pickLang(lang, LANG[l]?.ar || l, LANG[l]?.en || l, LANG[l]?.fr || l)}</span>)}
          </div>
        </div>

        {t.bio && <Section icon={GraduationCap} title={pickLang(lang, 'نبذة', 'About', 'À propos')}>{t.bio}</Section>}
        {t.approach && <Section icon={BookOpen} title={pickLang(lang, 'أسلوب التدريس', 'Teaching approach', 'Approche pédagogique')}>{t.approach}</Section>}
        {t.certifications && <Section icon={Award} title={pickLang(lang, 'الشهادات', 'Certifications', 'Certifications')}>{t.certifications}</Section>}

        {/* CTA — request a trial */}
        <div className="rounded-3xl p-6 text-white text-center" style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
          <Sparkles className="w-6 h-6 mx-auto mb-2" />
          <p className="font-black text-lg">{pickLang(lang, 'احجز حصّة تقييم مجانيّة', 'Book a free trial lesson', 'Réservez un cours d’essai gratuit')}</p>
          <p className="text-white/75 text-sm mt-1">{pickLang(lang, 'تعرّف على الأستاذ وناسب طفلك قبل الالتزام.', 'Meet the teacher and check the fit before committing.', 'Rencontrez le professeur avant de vous engager.')}</p>
          <Link href="/languages#enroll" className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-2xl bg-white font-extrabold text-sm" style={{ color: PURPLE }}>
            {pickLang(lang, 'اطلب حصّة تقييم', 'Request a trial', 'Demander un essai')} <Fwd className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  )
}
