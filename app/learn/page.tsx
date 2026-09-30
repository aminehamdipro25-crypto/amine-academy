'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLang, pickLang } from '@/lib/i18n'
import LangToggle from '@/components/shared/LangToggle'
import { CEFR_DESCRIPTORS, CEFR_ORDER, type CEFRLevel } from '@/lib/languages/placement-fr'
import ChatPanel from './ChatPanel'
import BookingCard from './BookingCard'
import { Languages as LangIcon, GraduationCap, User, BookOpen, CalendarClock, LogOut, Loader2, Trophy, Clock, Video, Flame, Star, Dumbbell, Sparkles, Award } from 'lucide-react'

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

interface Learner { id: string; name: string; language: string; level: string; teacherName: string | null; fit?: string; nextLesson?: { at: string; link: string; note?: string } | null }
interface LSession { id: string; dateISO: string; language: string; durationHours: number; status: string }
interface Progress { xp: number; streak: number; exercisesDone: number; reviewsDone: number }

export default function LearnerPortal() {
  const { lang } = useLang()
  const rtl = lang === 'ar'
  const router = useRouter()
  const [learner, setLearner] = useState<Learner | null>(null)
  const [sessions, setSessions] = useState<LSession[]>([])
  const [progress, setProgress] = useState<Progress>({ xp: 0, streak: 0, exercisesDone: 0, reviewsDone: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/learner/me')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setLearner(d.learner); setSessions(d.sessions || []); if (d.progress) setProgress(d.progress) })
      .catch(() => router.push('/learn/login'))
      .finally(() => setLoading(false))
  }, [router])

  async function logout() {
    await fetch('/api/learner/auth', { method: 'DELETE' }).catch(() => {})
    router.push('/learn/login')
  }

  async function decideFit(decision: 'accept' | 'decline') {
    await fetch('/api/learner/fit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision }) }).catch(() => {})
    setLearner(l => l ? { ...l, fit: decision === 'accept' ? 'accepted' : 'declined_learner' } : l)
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

        {/* Progress + practice */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-around text-center mb-4">
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-black" style={{ color: '#F97316' }}><Flame className="w-5 h-5" />{progress.streak}</div>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">{pickLang(lang, 'سلسلة يوميّة', 'Day streak', 'Série')}</p>
            </div>
            <div className="w-px h-10 bg-slate-100" />
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-black" style={{ color: PURPLE }}><Star className="w-5 h-5" />{progress.xp}</div>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">XP</p>
            </div>
            <div className="w-px h-10 bg-slate-100" />
            <div>
              <div className="text-2xl font-black text-slate-800">{progress.exercisesDone}</div>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">{pickLang(lang, 'تمارين', 'Exercises', 'Exercices')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/learn/practice" className="flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-white text-sm" style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
              <Dumbbell className="w-4 h-4" /> {pickLang(lang, 'تمارين اليوم', 'Practice', 'Exercices')}
            </Link>
            <Link href="/learn/vocab" className="flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-sm border-2" style={{ borderColor: 'rgba(107,70,240,0.25)', color: PURPLE }}>
              <Sparkles className="w-4 h-4" /> {pickLang(lang, 'مفردات', 'Vocabulary', 'Vocabulaire')}
            </Link>
          </div>
          <Link href="/learn/leaderboard" className="flex items-center justify-center gap-1.5 mt-3 text-xs font-bold text-slate-400 hover:text-violet-600 transition">
            <Trophy className="w-3.5 h-3.5" /> {pickLang(lang, 'لوحة المتصدّرين', 'Leaderboard', 'Classement')}
          </Link>
        </div>

        {/* Next lesson */}
        {learner.nextLesson?.link && (
          <a href={learner.nextLesson.link} target="_blank" rel="noreferrer"
            className="block rounded-3xl p-5 text-white shadow-lg transition hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, #8B6BF0)` }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white/70 text-xs font-bold">{pickLang(lang, 'حصّتك القادمة', 'Your next lesson', 'Votre prochain cours')}</p>
                <p className="font-black text-lg">{learner.nextLesson.at || pickLang(lang, 'قريباً', 'Soon', 'Bientôt')}</p>
                {learner.nextLesson.note && <p className="text-white/70 text-xs mt-0.5">{learner.nextLesson.note}</p>}
              </div>
              <span className="inline-flex items-center gap-1.5 bg-white text-sm font-extrabold px-4 py-2.5 rounded-2xl flex-shrink-0" style={{ color: PURPLE }}>
                <Video className="w-4 h-4" /> {pickLang(lang, 'انضم للحصّة', 'Join lesson', 'Rejoindre')}
              </span>
            </div>
          </a>
        )}

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

        {/* Certificates for achieved levels */}
        {CEFR_ORDER.indexOf(lvl) >= 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-3"><Award className="w-4 h-4" style={{ color: PURPLE }} /> {pickLang(lang, 'شهاداتي', 'My certificates', 'Mes certificats')}</h2>
            <div className="flex flex-wrap gap-2">
              {CEFR_ORDER.slice(0, CEFR_ORDER.indexOf(lvl) + 1).map(cl => (
                <Link key={cl} href={`/learn/certificate?level=${cl}`} className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl border transition hover:bg-violet-50" style={{ borderColor: 'rgba(107,70,240,0.25)', color: PURPLE }}>
                  <Award className="w-3.5 h-3.5" /> {pickLang(lang, `شهادة ${cl}`, `${cl} certificate`, `Certificat ${cl}`)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Teacher card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(107,70,240,0.08)', color: PURPLE }}><User className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400">{pickLang(lang, 'أستاذك', 'Your teacher', 'Votre professeur')}</p>
              <p className="font-black text-slate-800">{learner.teacherName || pickLang(lang, 'سيتم تعيين أستاذ قريباً', 'A teacher will be assigned soon', 'Un professeur vous sera bientôt attribué')}</p>
            </div>
            {learner.fit === 'accepted' && <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">✓ {pickLang(lang, 'متابعة مؤكّدة', 'Confirmed', 'Confirmé')}</span>}
          </div>
          {/* Mutual fit after a trial */}
          {learner.teacherName && learner.fit === 'declined_teacher' && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">{pickLang(lang, 'يبحث لك المدير عن أستاذ أنسب.', 'The director is finding a better-matched teacher for you.', 'Le directeur vous cherche un meilleur professeur.')}</p>
          )}
          {learner.teacherName && learner.fit === 'declined_learner' && (
            <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">{pickLang(lang, 'طلبت تغيير الأستاذ — سيتواصل معك المدير.', 'You asked to change teacher — the director will reach out.', 'Vous avez demandé un changement.')}</p>
          )}
          {learner.teacherName && (learner.fit === undefined || learner.fit === 'pending') && (
            <div className="mt-3 flex items-center gap-2">
              <p className="text-[11px] text-slate-400 flex-1">{pickLang(lang, 'بعد حصّة التعارف، هل الأستاذ مناسب؟', 'After the trial, is this teacher a good fit?', 'Après l’essai, ce professeur vous convient-il ?')}</p>
              <button onClick={() => decideFit('accept')} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-white" style={{ background: '#16a34a' }}>{pickLang(lang, 'مناسب ✓', 'Good ✓', 'Oui ✓')}</button>
              <button onClick={() => decideFit('decline')} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-amber-700 bg-amber-50">{pickLang(lang, 'أستاذ آخر', 'Change', 'Changer')}</button>
            </div>
          )}
        </div>

        {/* Booking */}
        <BookingCard hasTeacher={!!learner.teacherName} />

        {/* Chat with teacher */}
        <ChatPanel />

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
