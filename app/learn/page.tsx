'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import { CEFR_DESCRIPTORS, type CEFRLevel } from '@/lib/languages/placement-fr'
import { Languages as LangIcon, GraduationCap, User, BookOpen, CalendarClock, LogOut, Loader2, Trophy, Clock } from 'lucide-react'

const PURPLE = '#6B46F0'
const PURPLE2 = '#9A7BFD'
const LANG_LABEL: Record<string, { ar: string; en: string; fr: string }> = {
  french: { ar: 'الفرنسيّة', en: 'French', fr: 'Français' },
  english: { ar: 'الإنجليزيّة', en: 'English', fr: 'Anglais' },
  spanish: { ar: 'الإسبانيّة', en: 'Spanish', fr: 'Espagnol' },
  arabic: { ar: 'العربيّة', en: 'Arabic', fr: 'Arabe' },
  german: { ar: 'الألمانيّة', en: 'German', fr: 'Allemand' },
  italian: { ar: 'الإيطاليّة', en: 'Italian', fr: 'Italien' },
}

interface Learner { id: string; name: string; language: string; level: string; teacherName: string | null }
interface LSession { id: string; dateISO: string; language: string; durationHours: number; status: string }

export default function LearnerPortal() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const router = useRouter()
  const [learner, setLearner] = useState<Learner | null>(null)
  const [sessions, setSessions] = useState<LSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/learner/me')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setLearner(d.learner); setSessions(d.sessions || []) })
      .catch(() => router.push('/learn/login'))
      .finally(() => setLoading(false))
  }, [router])

  async function logout() {
    await fetch('/api/learner/auth', { method: 'DELETE' }).catch(() => {})
    router.push('/learn/login')
  }

  if (loading) return <div className="min-h-[100dvh] bg-[#FFF8F0] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: PURPLE }} /></div>
  if (!learner) return null

  const lvl = learner.level as CEFRLevel
  const d = CEFR_DESCRIPTORS[lvl]
  const langLabel = LANG_LABEL[learner.language] || LANG_LABEL.french

  return (
    <main className="min-h-[100dvh] bg-[#FFF8F0]" dir={rtl ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-40 backdrop-blur bg-[#FFF8F0]/85 border-b border-black/5">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}><LangIcon className="w-5 h-5" /></div>
            <p className="font-black text-slate-800 text-sm">{pickLang(lang, 'بوّابة المتعلّم', 'Learner Portal', 'Espace apprenant')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <button onClick={logout} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition px-2 py-2">
              <LogOut className="w-4 h-4" /> {pickLang(lang, 'خروج', 'Logout', 'Quitter')}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Greeting */}
        <div>
          <p className="text-slate-400 text-sm">{pickLang(lang, 'مرحباً', 'Welcome', 'Bonjour')}</p>
          <h1 className="text-2xl font-black text-slate-800">{learner.name} 👋</h1>
        </div>

        {/* Level card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }}>
              {lvl && d ? lvl : '—'}
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{pickLang(lang, `مستواك في ${pickLang(lang, langLabel.ar, langLabel.en, langLabel.fr)}`, `Your ${langLabel.en} level`, `Votre niveau de ${langLabel.fr}`)}</p>
              <p className="font-black text-slate-800 text-lg">{d ? pickLang(lang, d.titleAr, d.titleEn, d.titleFr) : pickLang(lang, 'لم يُحدّد بعد', 'Not set yet', 'Non défini')}</p>
              {d && <p className="text-slate-500 text-sm mt-0.5">{pickLang(lang, d.canDoAr, d.canDoEn, d.canDoFr)}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {d && (
              <Link href={`/languages/curriculum?level=${lvl}`} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white" style={{ background: PURPLE }}>
                <BookOpen className="w-3.5 h-3.5" /> {pickLang(lang, 'مسار تعلّمي', 'My learning path', 'Mon parcours')}
              </Link>
            )}
            <Link href="/languages/placement" className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border" style={{ borderColor: 'rgba(107,70,240,0.25)', color: PURPLE }}>
              <GraduationCap className="w-3.5 h-3.5" /> {pickLang(lang, 'إعادة تقييم مستواي', 'Re-test my level', 'Refaire le test')}
            </Link>
          </div>
        </div>

        {/* Teacher card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE }}><User className="w-5 h-5" /></div>
          <div>
            <p className="text-xs font-bold text-slate-400">{pickLang(lang, 'أستاذك', 'Your teacher', 'Votre professeur')}</p>
            <p className="font-black text-slate-800">{learner.teacherName || pickLang(lang, 'سيتم تعيين أستاذ قريباً', 'A teacher will be assigned soon', 'Un professeur vous sera bientôt attribué')}</p>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <CalendarClock className="w-4 h-4" style={{ color: PURPLE }} />
            <h2 className="font-black text-slate-800 text-sm">{pickLang(lang, 'حصصي', 'My sessions', 'Mes cours')}</h2>
          </div>
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
              {pickLang(lang, 'لا حصص بعد — ستظهر هنا بعد أوّل حصّة مع أستاذك.', 'No sessions yet — they’ll appear here after your first lesson.', 'Aucun cours pour l’instant.')}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 tabular-nums w-20" dir="ltr">{s.dateISO}</span>
                    <span className="font-bold text-slate-700">{pickLang(lang, (LANG_LABEL[s.language] || langLabel).ar, (LANG_LABEL[s.language] || langLabel).en, (LANG_LABEL[s.language] || langLabel).fr)}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{s.durationHours} {pickLang(lang, 'ساعة', 'h', 'h')} · {s.status === 'completed' ? pickLang(lang, 'تمّت', 'done', 'terminé') : pickLang(lang, 'مجدولة', 'scheduled', 'prévu')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
