'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import { Languages as LangIcon, GraduationCap, Award, ArrowLeft, ArrowRight, Loader2, Users } from 'lucide-react'

const PURPLE = '#6B46F0'
const PURPLE2 = '#9A7BFD'
interface T { id: string; name: string; headline: string; experienceYears: number | null; languages: string[]; bio: string }
const LANG: Record<string, { ar: string; en: string; fr: string; flag: string }> = {
  french: { ar: 'الفرنسيّة', en: 'French', fr: 'Français', flag: '🇫🇷' }, english: { ar: 'الإنجليزيّة', en: 'English', fr: 'Anglais', flag: '🇬🇧' },
  spanish: { ar: 'الإسبانيّة', en: 'Spanish', fr: 'Espagnol', flag: '🇪🇸' }, arabic: { ar: 'العربيّة', en: 'Arabic', fr: 'Arabe', flag: '🇸🇦' },
  german: { ar: 'الألمانيّة', en: 'German', fr: 'Allemand', flag: '🇩🇪' }, italian: { ar: 'الإيطاليّة', en: 'Italian', fr: 'Italien', flag: '🇮🇹' },
}

export default function TeachersPage() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const Fwd = rtl ? ArrowLeft : ArrowRight
  const [teachers, setTeachers] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/teachers').then(r => r.ok ? r.json() : { teachers: [] }).then(d => setTeachers(d.teachers || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0]" dir={rtl ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-40 backdrop-blur bg-[#FFF8F0]/85 border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/languages" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}><LangIcon className="w-5 h-5" /></div>
            <p className="font-black text-slate-800 text-sm">{pickLang(lang, 'أمين للّغات', 'Amine Languages', 'Amine Langues')}</p>
          </Link>
          <LangToggle />
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 pt-12 pb-8 text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE, border: '1px solid rgba(107,70,240,0.2)' }}>
          <Users className="w-3.5 h-3.5" /> {pickLang(lang, 'فريقنا', 'Our team', 'Notre équipe')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800">{pickLang(lang, 'أساتذتنا', 'Our teachers', 'Nos professeurs')}</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-3 max-w-xl mx-auto">{pickLang(lang, 'تعرّف على أساتذتنا قبل أن تبدأ — خبرة وشفافيّة ومصداقيّة.', 'Meet our teachers before you start — experience, transparency, trust.', 'Rencontrez nos professeurs — expérience et transparence.')}</p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin" style={{ color: PURPLE }} /></div>
        ) : teachers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center text-slate-400 text-sm">{pickLang(lang, 'سيظهر الأساتذة هنا قريباً.', 'Teachers will appear here soon.', 'Bientôt disponible.')}</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teachers.map(t => (
              <Link key={t.id} href={`/languages/teacher/${t.id}`} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}>{t.name.charAt(0)}</div>
                  <div>
                    <p className="font-black text-slate-800">{t.name}</p>
                    {t.experienceYears != null && <p className="text-xs text-slate-400 flex items-center gap-1"><Award className="w-3 h-3" /> {t.experienceYears}+ {pickLang(lang, 'سنوات خبرة', 'yrs experience', 'ans')}</p>}
                  </div>
                </div>
                {t.headline && <p className="text-sm font-bold text-slate-700 mb-2">{t.headline}</p>}
                {t.bio && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{t.bio}</p>}
                <div className="flex items-center gap-1.5 mt-3">
                  {t.languages.map(l => <span key={l} className="text-lg">{LANG[l]?.flag || '🌐'}</span>)}
                  <span className="ms-auto inline-flex items-center gap-1 text-xs font-bold" style={{ color: PURPLE }}>{pickLang(lang, 'الملف', 'Profile', 'Profil')} <Fwd className="w-3 h-3" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
