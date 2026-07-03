'use client'
import { useLang, pickLang } from '@/lib/i18n'

const steps = [
  {
    num: '01',
    title: 'التسجيل وتقييم الحالة',
    titleEn: 'Registration & Case Assessment',
    titleFr: "Inscription et évaluation du dossier",
    desc: 'يسجّل ولي الأمر ويملأ استبيان مفصل عن طفله (العمر، التشخيص، الحساسيات الحسية، الأهداف).',
    descEn: 'The parent registers and fills out a detailed questionnaire about their child (age, diagnosis, sensory sensitivities, and goals).',
    descFr: "Le parent s'inscrit et remplit un questionnaire détaillé sur son enfant (âge, diagnostic, sensibilités sensorielles, objectifs).",
    icon: '📋',
    gradient: 'linear-gradient(135deg, #6366F1, #818CF8)',
  },
  {
    num: '02',
    title: 'تصميم البرنامج المخصص',
    titleEn: 'Personalized Program Design',
    titleFr: 'Conception du programme personnalisé',
    desc: 'الأستاذ أمين يراجع الملف ويصمم برنامجاً فردياً يتضمن جدولاً أسبوعياً من التمارين الحركية والتدخلات الوظيفية.',
    descEn: 'Prof. Amine reviews the file and designs an individualized program with a weekly schedule of movement exercises and functional interventions.',
    descFr: "Le professeur Amine étudie le dossier et conçoit un programme individuel avec un planning hebdomadaire d'exercices moteurs et d'interventions fonctionnelles.",
    icon: '🎯',
    gradient: 'linear-gradient(135deg, #8B5CF6, #C084FC)',
  },
  {
    num: '03',
    title: 'التطبيق اليومي التفاعلي',
    titleEn: 'Daily Interactive Practice',
    titleFr: 'Pratique interactive quotidienne',
    desc: 'الطفل يستخدم واجهة مرحة وسهلة لأداء تمارين اليوم، يربح نقاط وأوسمة مع كل إنجاز.',
    descEn: "The child uses a fun, easy-to-use interface to complete daily exercises and earns points and badges with every achievement.",
    descFr: "L'enfant utilise une interface ludique et facile à prendre en main pour réaliser ses exercices du jour, en gagnant des points et des badges à chaque réussite.",
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #14B8A6, #6366F1)',
  },
  {
    num: '04',
    title: 'متابعة الأولياء والتقارير',
    titleEn: 'Parent Monitoring & Reports',
    titleFr: 'Suivi parental et rapports',
    desc: 'ولي الأمر يتابع لوحة تحكم متكاملة تعرض التقدم، التقارير الدورية، وملاحظات الأستاذ.',
    descEn: "The parent follows a comprehensive dashboard showing progress, periodic reports, and the instructor's notes.",
    descFr: "Le parent dispose d'un tableau de bord complet présentant les progrès, les rapports périodiques et les observations du professeur.",
    icon: '📊',
    gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
  },
  {
    num: '05',
    title: 'جلسات متابعة دورية',
    titleEn: 'Regular Follow-Up Sessions',
    titleFr: 'Séances de suivi régulières',
    desc: 'مواعيد فردية دورية مع الأستاذ أمين لمراجعة التقدم وتعديل البرنامج حسب استجابة الطفل.',
    descEn: "Periodic individual appointments with Prof. Amine to review progress and adjust the program according to the child's response.",
    descFr: "Des rendez-vous individuels réguliers avec le professeur Amine pour évaluer les progrès et ajuster le programme selon la réponse de l'enfant.",
    icon: '🤝',
    gradient: 'linear-gradient(135deg, #10B981, #34D399)',
  },
]

export default function HowItWorks() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  return (
    <section
      id="how-it-works"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: `
          radial-gradient(ellipse 60% 50% at 50% 0%, rgba(107,70,240,0.05) 0%, transparent 60%),
          #FFFBF5
        `,
        padding: '80px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(107,70,240,0.08)', border: '1px solid rgba(107,70,240,0.15)', color: '#6B46F0' }}
          >
            {pickLang(lang, 'آلية العمل', 'How It Works', 'Comment ça marche')}
          </span>
          <h2
            className="text-3xl md:text-4xl font-black mt-4 mb-4"
            style={{ color: '#1E293B' }}
          >
            {pickLang(lang, 'كيف تعمل أكاديمية أمين؟', 'How Does Amine Academy Work?', 'Comment fonctionne Amine Academy ?')}
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: '#64748B' }}>
            {pickLang(lang, 'خمس خطوات بسيطة تحول حياة طفلك.', "Five simple steps that transform your child's life.", "Cinq étapes simples qui transforment la vie de votre enfant.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {steps.map((step) => (
            <div key={step.num} className="relative flex flex-col items-center text-center">
              <div
                className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center mb-4 text-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                style={{ background: step.gradient, boxShadow: '0 4px 16px rgba(107,70,240,0.20)' }}
              >
                {step.icon}
              </div>

              <div
                className="w-full rounded-3xl p-5 transition-all hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  className="font-black text-xs mb-1.5 ltr-num"
                  style={{
                    background: step.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {step.num}
                </div>
                <h3 className="font-black text-sm mb-2" style={{ color: '#1E293B' }}>{pickLang(lang, step.title, step.titleEn, step.titleFr)}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>{pickLang(lang, step.desc, step.descEn, step.descFr)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
