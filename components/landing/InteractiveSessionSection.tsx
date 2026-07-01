'use client'
import Link from 'next/link'
import { Video, CheckCircle, Clock, Users, Star } from 'lucide-react'
import { useLang, pickLang } from '@/lib/i18n'

const STEPS = [
  {
    num: '01',
    gradient: 'linear-gradient(135deg,#6366F1,#818CF8)',
    title: 'الاتصال بالفيديو',
    titleEn: 'Video Call',
    titleFr: 'Appel vidéo',
    desc: 'الأستاذ أمين والطفل وجهاً لوجه عبر الشاشة. الوالد موجود يراقب ويتعلم.',
    descEn: 'Prof. Amine and the child face-to-face via screen. The parent is present, observing and learning.',
    descFr: "Le professeur Amine et l'enfant se retrouvent face à face via l'écran. Le parent est présent, il observe et apprend.",
    icon: Video,
  },
  {
    num: '02',
    gradient: 'linear-gradient(135deg,#10B981,#34D399)',
    title: 'التمارين الحية',
    titleEn: 'Live Exercises',
    titleFr: 'Exercices en direct',
    desc: 'الطفل يؤدي التمارين أمام الكاميرا — الأستاذ يصحح الحركة في الوقت الفعلي ويحفّزه.',
    descEn: 'The child performs exercises in front of the camera — the instructor corrects movement in real time and provides encouragement.',
    descFr: "L'enfant effectue les exercices devant la caméra — le professeur corrige le mouvement en temps réel et l'encourage.",
    icon: CheckCircle,
  },
  {
    num: '03',
    gradient: 'linear-gradient(135deg,#8B5CF6,#C084FC)',
    title: 'تعديل السلوك',
    titleEn: 'Behavior Modification',
    titleFr: 'Modification du comportement',
    desc: 'خلال الجلسة نطبق بروتوكول ABA أو Zone of Regulation مباشرة مع الطفل.',
    descEn: 'During the session we apply the ABA protocol or Zone of Regulation directly with the child.',
    descFr: "Pendant la séance, nous appliquons directement avec l'enfant le protocole ABA ou la Zone of Regulation.",
    icon: Star,
  },
  {
    num: '04',
    gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
    title: 'توجيه الوالد',
    titleEn: 'Parent Coaching',
    titleFr: 'Accompagnement du parent',
    desc: '10 دقائق لتعليم الوالد كيف يكرر التمارين يومياً في البيت. الوالد شريك، لا مُتفرّج.',
    descEn: '10 minutes to teach the parent how to repeat the exercises daily at home. The parent is a partner, not a spectator.',
    descFr: "10 minutes pour apprendre au parent à reproduire les exercices chaque jour à la maison. Le parent est un partenaire, pas un simple spectateur.",
    icon: Users,
  },
]

const BENEFITS_AR = [
  'الطفل لا يتنقل — راحة الأسرة', 'تقييم حركي دقيق بالكاميرا',
  'تسجيل الجلسة للمراجعة', 'جلسات مرنة بالتوقيت',
  'تواصل مستمر بين الجلسات', 'برنامج يتكيف أسبوعياً',
]
const BENEFITS_EN = [
  'No travel needed — family convenience', 'Precise motor assessment via camera',
  'Session recording for review', 'Flexible session scheduling',
  'Continuous communication between sessions', 'Program adapts weekly',
]
const BENEFITS_FR = [
  'Aucun déplacement — confort pour la famille', 'Évaluation motrice précise par caméra',
  'Enregistrement de la séance pour révision', 'Horaires de séances flexibles',
  'Communication continue entre les séances', 'Programme ajusté chaque semaine',
]

const SESSION_TIMELINE_AR = [
  { time: '0–5 دق',   label: 'فحص المنطقة العاطفية', note: 'Zone of Regulation check-in', gradient: 'linear-gradient(135deg,#6366F1,#818CF8)' },
  { time: '5–20 دق',  label: 'تمارين APA الحركية',   note: 'موجّهة مباشرة بالكاميرا',   gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)' },
  { time: '20–30 دق', label: 'تدريب CBT / ABA',       note: 'بروتوكول مخصص للطفل',        gradient: 'linear-gradient(135deg,#8B5CF6,#C084FC)' },
  { time: '30–40 دق', label: 'نقاط وإنجازات',          note: 'تفعيل دوبامين المكافأة',     gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)' },
  { time: '40–45 دق', label: 'توجيه الوالد',           note: 'خطة أسبوعية واضحة',         gradient: 'linear-gradient(135deg,#10B981,#34D399)' },
]
const SESSION_TIMELINE_EN = [
  { time: '0–5 min',   label: 'Emotional zone check', note: 'Zone of Regulation check-in', gradient: 'linear-gradient(135deg,#6366F1,#818CF8)' },
  { time: '5–20 min',  label: 'APA motor exercises',  note: 'Live camera-guided',           gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)' },
  { time: '20–30 min', label: 'CBT / ABA training',   note: 'Child-specific protocol',      gradient: 'linear-gradient(135deg,#8B5CF6,#C084FC)' },
  { time: '30–40 min', label: 'Points & achievements', note: 'Reward dopamine activation',  gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)' },
  { time: '40–45 min', label: 'Parent coaching',       note: 'Clear weekly action plan',    gradient: 'linear-gradient(135deg,#10B981,#34D399)' },
]
const SESSION_TIMELINE_FR = [
  { time: '0–5 min',   label: 'Bilan de la zone émotionnelle', note: 'Point Zone of Regulation', gradient: 'linear-gradient(135deg,#6366F1,#818CF8)' },
  { time: '5–20 min',  label: 'Exercices moteurs APA',  note: 'Guidés en direct par caméra',  gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)' },
  { time: '20–30 min', label: 'Entraînement TCC / ABA', note: "Protocole propre à l'enfant",  gradient: 'linear-gradient(135deg,#8B5CF6,#C084FC)' },
  { time: '30–40 min', label: 'Points et succès',       note: 'Activation de la récompense dopaminergique', gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)' },
  { time: '40–45 min', label: 'Accompagnement du parent', note: "Plan d'action hebdomadaire clair", gradient: 'linear-gradient(135deg,#10B981,#34D399)' },
]

export default function InteractiveSessionSection() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  const benefits = pickLang(lang, BENEFITS_AR, BENEFITS_EN, BENEFITS_FR)
  const timeline = pickLang(lang, SESSION_TIMELINE_AR, SESSION_TIMELINE_EN, SESSION_TIMELINE_FR)

  return (
    <section
      id="how-it-works"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: `
          radial-gradient(ellipse 60% 45% at 70% 20%, rgba(14,165,233,0.14) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 30% 80%, rgba(99,102,241,0.12) 0%, transparent 55%),
          linear-gradient(180deg, #0E1230 0%, #081A28 100%)
        `,
        padding: '96px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', color: '#C4B5FD' }}
          >
            {pickLang(lang, 'الجلسة التفاعلية', 'The Interactive Session', 'La séance interactive')}
          </span>
          <h2
            className="text-3xl md:text-5xl font-black mb-5"
            style={{
              background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.65) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {pickLang(lang, 'ليست مجرد مكالمة فيديو', 'More Than Just a Video Call', "Bien plus qu'un simple appel vidéo")}
          </h2>
          <p className="text-white/65 max-w-2xl mx-auto text-lg leading-relaxed">
            {pickLang(
              lang,
              'كل جلسة هي تجربة تعليمية متكاملة — الطفل يتحرك، يتعلم، ويكسب نقاطاً. الوالد يخرج بخطة يومية واضحة.',
              'Every session is a complete learning experience — the child moves, learns, and earns points. The parent leaves with a clear daily plan.',
              "Chaque séance est une expérience d'apprentissage complète — l'enfant bouge, apprend et gagne des points. Le parent repart avec un plan quotidien clair."
            )}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.num}
                className="rounded-3xl p-6 transition-all hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.13)',
                  border: '1px solid rgba(255,255,255,0.13)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                    style={{ background: step.gradient }}
                  >
                    {step.num}
                  </span>
                  <Icon className="w-5 h-5 text-white/55" />
                </div>
                <h3 className="text-white font-black text-base mb-2">{pickLang(lang, step.title, step.titleEn, step.titleFr)}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{pickLang(lang, step.desc, step.descEn, step.descFr)}</p>
              </div>
            )
          })}
        </div>

        {/* Session preview card */}
        <div
          className="rounded-3xl p-8 md:p-10 mb-10"
          style={{
            background: 'rgba(255,255,255,0.13)',
            border: '1px solid rgba(255,255,255,0.13)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 20px 64px rgba(0,0,0,0.3)',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Timeline */}
            <div>
              <h3 className="text-white font-black text-2xl mb-6">
                {pickLang(lang, 'ماذا يحدث في 45 دقيقة؟', 'What Happens in 45 Minutes?', 'Que se passe-t-il en 45 minutes ?')}
              </h3>
              <div className="space-y-4">
                {timeline.map(({ time, label, note, gradient }) => (
                  <div key={time} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-24 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: gradient }} />
                      <span className="text-white/50 text-xs ltr-num">{time}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-white/80 font-bold text-sm">{label}</span>
                      <span className="text-white/45 text-xs mx-2">{note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="text-white font-black text-2xl mb-6">
                {pickLang(lang, 'لماذا عن بُعد يعمل أفضل؟', 'Why Does Remote Work Better?', 'Pourquoi le suivi à distance fonctionne-t-il mieux ?')}
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {benefits.map(b => (
                  <div key={b} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-white/60 text-sm">{b}</span>
                  </div>
                ))}
              </div>

              <div
                className="flex items-center gap-4 rounded-2xl p-5"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                <Clock className="w-8 h-8 flex-shrink-0" style={{ color: '#818CF8' }} />
                <div>
                  <p className="text-white font-black text-sm">
                    {pickLang(lang, 'جلسة تقييمية مجانية للتعارف', 'Free Assessment Session', "Séance d'évaluation gratuite")}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">
                    {pickLang(
                      lang,
                      '30 دقيقة مع الأستاذ أمين — بدون أي التزام',
                      '30 minutes with Prof. Amine — no commitment required',
                      '30 minutes avec le professeur Amine — sans aucun engagement'
                    )}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-3 font-black text-lg px-10 py-4 rounded-2xl transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            }}
          >
            <Video className="w-5 h-5" />
            {pickLang(lang, 'احجز الجلسة التقييمية المجانية', 'Book Your Free Assessment Session', "Réservez votre séance d'évaluation gratuite")}
          </Link>
          <p className="text-white/45 text-sm mt-4">
            {pickLang(lang, 'بدون بطاقة ائتمانية • متاح لجميع الدول', 'No credit card required • Available worldwide', 'Sans carte bancaire • Disponible partout dans le monde')}
          </p>
        </div>

      </div>
    </section>
  )
}
