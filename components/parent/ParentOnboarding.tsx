'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useLang, tr } from '@/lib/i18n'

const STORAGE_KEY = 'amine-academy:onboarding-done'

const STEPS = [
  {
    emoji: '📋',
    titleAr: 'برنامج أسبوعي مخصص',
    titleEn: 'Personalised Weekly Plan',
    titleFr: 'Programme hebdomadaire personnalisé',
    descAr: 'يصمم الأخصائي برنامجاً يومياً لطفلك بناءً على تشخيصه واحتياجاته.',
    descEn: "The specialist designs a daily plan tailored to your child's diagnosis and needs.",
    descFr: 'Le spécialiste conçoit un programme quotidien adapté au diagnostic de votre enfant.',
  },
  {
    emoji: '🎮',
    titleAr: 'تمارين تفاعلية في المنزل',
    titleEn: 'Interactive Home Exercises',
    titleFr: 'Exercices interactifs à domicile',
    descAr: 'تمارين مصممة خصيصاً يمكنك تطبيقها مع طفلك في المنزل بين الجلسات.',
    descEn: 'Specially designed exercises you can do with your child at home between sessions.',
    descFr: 'Des exercices spécialement conçus à pratiquer avec votre enfant entre les séances.',
  },
  {
    emoji: '📊',
    titleAr: 'متابعة التقدم',
    titleEn: 'Track Progress',
    titleFr: 'Suivi des progrès',
    descAr: 'اطلع على تقارير الجلسات وتقدم طفلك أسبوعاً بأسبوع.',
    descEn: "View session reports and your child's progress week by week.",
    descFr: 'Consultez les rapports de séances et les progrès de votre enfant semaine après semaine.',
  },
]

export default function ParentOnboarding() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setShow(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  const s = STEPS[step]
  const title = lang === 'en' ? s.titleEn : lang === 'fr' ? s.titleFr : s.titleAr
  const desc  = lang === 'en' ? s.descEn  : lang === 'fr' ? s.descFr  : s.descAr
  const isLast = step === STEPS.length - 1

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) dismiss() }}
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28 }}
            dir={isAr ? 'rtl' : 'ltr'}
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}
          >
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pt-5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width:  i === step ? 20 : 6,
                    height: 6,
                    background: i === step ? '#6B46F0' : '#E0D0FF',
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="px-7 py-6 text-center">
              <div className="text-6xl mb-4">{s.emoji}</div>
              <h2 className="font-black text-gray-900 text-xl mb-2">{title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-col gap-2">
              {isLast ? (
                <>
                  <Link
                    href="/parent/children"
                    onClick={dismiss}
                    className="w-full text-center font-black text-base py-3.5 rounded-2xl text-white transition-all"
                    style={{ background: '#6B46F0', boxShadow: '0 4px 16px rgba(107,70,240,0.3)' }}
                  >
                    {isAr ? 'ابدأ الآن 🚀' : lang === 'fr' ? 'Commencer 🚀' : 'Get Started 🚀'}
                  </Link>
                  <button
                    onClick={dismiss}
                    className="w-full text-center font-bold text-sm py-2 rounded-2xl text-gray-400 transition-all hover:text-gray-600"
                  >
                    {isAr ? 'استكشف بنفسي' : lang === 'fr' ? 'Explorer par moi-même' : 'Explore on my own'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="w-full font-black text-base py-3.5 rounded-2xl text-white transition-all"
                    style={{ background: '#6B46F0', boxShadow: '0 4px 16px rgba(107,70,240,0.3)' }}
                  >
                    {isAr ? 'التالي ←' : lang === 'fr' ? 'Suivant →' : 'Next →'}
                  </button>
                  <button
                    onClick={dismiss}
                    className="w-full text-center font-bold text-sm py-2 rounded-2xl text-gray-400 transition-all hover:text-gray-600"
                  >
                    {isAr ? 'تخطى' : lang === 'fr' ? 'Passer' : 'Skip'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
