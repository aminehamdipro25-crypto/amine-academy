'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarClock, MessageSquare, BookOpen, TrendingUp, CheckCircle2, GraduationCap, BookMarked } from 'lucide-react'
import { staggerContainer, fadeUp, popIn } from '@/lib/motion'
import { useLang, pickLang } from '@/lib/i18n'

// The home a language teacher (staff) sees — their own tools, not the owner's
// business dashboard. Clean and focused on running lessons.
export default function TeacherHome({ name }: { name: string }) {
  const { lang } = useLang()

  const tools = [
    { href: '/dashboard/my-sessions',   icon: CalendarClock, ar: 'حصصي', en: 'My sessions', fr: 'Mes cours', dAr: 'سجّل حصصك واطّلع على مستحقّاتك', dEn: 'Log lessons and see your earnings', dFr: 'Enregistrez vos cours et vos revenus', accent: 'from-brand-400 to-brand-700' },
    { href: '/dashboard/conversations', icon: MessageSquare, ar: 'محادثات المتعلّمين', en: 'Learner chats', fr: 'Discussions', dAr: 'تواصل مباشر مع تلاميذك', dEn: 'Chat directly with your learners', dFr: 'Discutez avec vos apprenants', accent: 'from-violet-400 to-violet-700' },
    { href: '/dashboard/curriculum',    icon: BookOpen, ar: 'دليل التدريس', en: 'Curriculum', fr: 'Programme', dAr: 'منهج CEFR وأهداف كل مستوى', dEn: 'CEFR syllabus and level goals', dFr: 'Programme CEFR et objectifs', accent: 'from-emerald-400 to-emerald-600' },
    { href: '/dashboard/my-lessons',     icon: BookMarked, ar: 'دروسي الخاصّة', en: 'My lessons', fr: 'Mes leçons', dAr: 'درّس بمنهجك ومادّتك بحرّيّة', dEn: 'Teach with your own material', dFr: 'Enseignez avec votre matériel', accent: 'from-amber-400 to-orange-500' },
    { href: '/dashboard/my-account',     icon: GraduationCap, ar: 'حسابي وملفّي', en: 'My account', fr: 'Mon compte', dAr: 'كلمة المرور والبورتفوليو العام', dEn: 'Password & public portfolio', dFr: 'Mot de passe & portfolio', accent: 'from-slate-400 to-slate-600' },
  ]

  const steps = [
    { ar: 'حضّر من «دليل التدريس» حسب مستوى تلميذك (A1–C2)', en: 'Prepare from the curriculum for your learner’s level', fr: 'Préparez à partir du programme selon le niveau' },
    { ar: 'أعطِ الحصّة مباشرة مع تلميذك (تنسّقان الموعد عبر المحادثة)', en: 'Deliver the live lesson (arrange timing via chat)', fr: 'Donnez le cours en direct (via la discussion)' },
    { ar: 'سجّل الحصّة في «حصصي» — تُحسب مستحقّاتك وتظهر لتلميذك تلقائياً', en: 'Log it in “My sessions” — your pay is computed and shown to the learner', fr: 'Enregistrez-le — votre rémunération est calculée automatiquement' },
  ]

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">
      {/* Greeting */}
      <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 border-l-4 border-l-brand-600 shadow-sm p-6 md:p-8">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-2">
          <GraduationCap className="w-3.5 h-3.5" /> {pickLang(lang, 'أستاذ لغة', 'Language teacher', 'Professeur de langue')}
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">{pickLang(lang, `مرحباً ${name} 👋`, `Welcome ${name} 👋`, `Bonjour ${name} 👋`)}</h1>
        <p className="text-gray-400 text-sm mt-1">{pickLang(lang, 'مساحتك لإدارة حصصك والتواصل مع تلاميذك.', 'Your space to run lessons and reach your learners.', 'Votre espace pour gérer vos cours et vos apprenants.')}</p>
      </motion.div>

      {/* Tools */}
      <motion.div className="grid md:grid-cols-3 gap-4" variants={staggerContainer}>
        {tools.map(t => (
          <motion.div key={t.href} variants={popIn}>
            <Link href={t.href} className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition h-full">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${t.accent} text-white flex items-center justify-center mb-3`}><t.icon className="w-5 h-5" /></div>
              <p className="font-black text-gray-900">{pickLang(lang, t.ar, t.en, t.fr)}</p>
              <p className="text-gray-400 text-sm mt-1">{pickLang(lang, t.dAr, t.dEn, t.dFr)}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* How a lesson works */}
      <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-brand-500" /> {pickLang(lang, 'كيف تسير الحصّة', 'How a lesson works', 'Comment se déroule un cours')}</h2>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-gray-600 text-sm leading-relaxed">{pickLang(lang, s.ar, s.en, s.fr)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {pickLang(lang, 'مستحقّاتك تُحسب تلقائياً حسب نسبتك من كل حصّة.', 'Your pay is auto-computed from your share of each lesson.', 'Votre rémunération est calculée automatiquement.')}
        </div>
      </motion.div>
    </motion.div>
  )
}
