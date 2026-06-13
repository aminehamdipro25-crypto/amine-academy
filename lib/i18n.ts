'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import React from 'react'

export type Lang = 'ar' | 'en'

const STORAGE_KEY = 'aa_lang'

interface LangCtx { lang: Lang; setLang: (l: Lang) => void }
const Ctx = createContext<LangCtx>({ lang: 'ar', setLang: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (saved === 'ar' || saved === 'en') setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l
    document.documentElement.dir  = l === 'ar' ? 'rtl' : 'ltr'
  }

  return React.createElement(Ctx.Provider, { value: { lang, setLang } }, children)
}

export function useLang() { return useContext(Ctx) }

// ── Translations ──────────────────────────────────────────────
export const tr = {
  ar: {
    nav: {
      trial:    'جولة تجريبية',
      parents:  'بوابة الأولياء',
      register: 'سجّل الآن',
      lang:     'EN',
    },
    hero: {
      badge:   'منصة عالمية معتمدة للرياضة المعدلة وعلم النفس',
      h1a:     'طفلك يفكّر',
      h1b:     'بطريقة مختلفة',
      h1c:     'ونحن نتحدّث لغته',
      desc:    'المنصة العربية الأولى التي تجمع الرياضة المعدّلة (APA) + تعديل السلوك (ABA) + التدريب المعرفي (CBT) في جلسات تفاعلية مباشرة لأطفال ADHD وطيف التوحد.',
      ages:    'للأعمار 5 – 22 سنة • قطر 🇶🇦 وتونس 🇹🇳 والعالم العربي',
      cta1:    'احجز الجلسة التقييمية المجانية',
      cta2:    'شاهد كيف تعمل الجلسة',
      offerLabel: '⏰ عرض التسجيل المبكر ينتهي خلال',
      units:   { d: 'يوم', h: 'ساعة', m: 'دقيقة', s: 'ثانية' },
      stats:   { children: 'طفل في البرنامج', years: 'سنوات خبرة متخصصة', satisfaction: 'رضا أولياء الأمور' },
    },
    register: {
      title:     'إنشاء حساب جديد',
      hasAccount:'لديك حساب؟',
      login:     'سجل دخول',
      steps: ['بيانات ولي الأمر','بيانات الطفل','اختيار الخطة'],
      next:      'التالي ←',
      prev:      'السابق',
      submit:    'إكمال التسجيل ✓',
      fields: {
        firstName: 'الاسم الأول', lastName: 'اسم العائلة',
        email: 'البريد الإلكتروني', phone: 'رقم الهاتف (واتساب)',
        country: 'الدولة', password: 'كلمة المرور',
        confirmPassword: 'تأكيد كلمة المرور',
        childFirstName: 'اسم الطفل', childLastName: 'اسم العائلة (اختياري)',
        birthDate: 'تاريخ الميلاد', diagnosis: 'التشخيص',
        severity: 'درجة الشدة', visualSens: 'الحساسية البصرية',
        audioSens: 'الحساسية السمعية',
      },
      severity: { 1: 'خفيف', 2: 'متوسط', 3: 'شديد' },
      sensitivity: { low: 'منخفضة', medium: 'متوسطة', high: 'مرتفعة' },
      countries: ['تونس','المغرب','الجزائر','مصر','السعودية','الإمارات','قطر','الكويت','فرنسا','غيرها'],
      selectCountry: 'اختر دولتك',
    },
    login: {
      title:    'بوابة أولياء الأمور',
      subtitle: 'تابع تطور طفلك',
      email:    'البريد الإلكتروني',
      password: 'كلمة المرور',
      submit:   'دخول',
      noAccount: 'ليس لديك حساب؟',
      register: 'سجّل الآن',
      errors: {
        invalid:  'بيانات غير صحيحة',
        network:  'حدث خطأ في الاتصال',
        timeout:  'انتهت مهلة الاتصال — تحقق من اتصالك وحاول مجدداً',
      },
    },
  },
  en: {
    nav: {
      trial:    'Free Trial',
      parents:  'Parents Portal',
      register: 'Register Now',
      lang:     'ع',
    },
    hero: {
      badge:   'Globally Accredited Platform for Adapted Sports & Psychology',
      h1a:     'Your Child Thinks',
      h1b:     'Differently',
      h1c:     'And We Speak Their Language',
      desc:    'The first Arabic platform combining Adapted Physical Activity (APA) + Applied Behavior Analysis (ABA) + Cognitive Behavioral Training (CBT) in live interactive sessions for children with ADHD and Autism Spectrum.',
      ages:    'Ages 5–22 • Qatar 🇶🇦, Tunisia 🇹🇳 & the Arab World',
      cta1:    'Book Your Free Assessment Session',
      cta2:    'Watch How a Session Works',
      offerLabel: '⏰ Early registration offer ends in',
      units:   { d: 'Days', h: 'Hours', m: 'Min', s: 'Sec' },
      stats:   { children: 'Children Enrolled', years: 'Years of Expertise', satisfaction: 'Parent Satisfaction' },
    },
    register: {
      title:     'Create New Account',
      hasAccount: 'Already have an account?',
      login:     'Sign In',
      steps: ['Parent Info','Child Info','Choose Plan'],
      next:      'Next →',
      prev:      'Back',
      submit:    'Complete Registration ✓',
      fields: {
        firstName: 'First Name', lastName: 'Last Name',
        email: 'Email Address', phone: 'Phone Number (WhatsApp)',
        country: 'Country', password: 'Password',
        confirmPassword: 'Confirm Password',
        childFirstName: "Child's First Name", childLastName: 'Last Name (optional)',
        birthDate: 'Date of Birth', diagnosis: 'Diagnosis',
        severity: 'Severity Level', visualSens: 'Visual Sensitivity',
        audioSens: 'Auditory Sensitivity',
      },
      severity: { 1: 'Mild', 2: 'Moderate', 3: 'Severe' },
      sensitivity: { low: 'Low', medium: 'Medium', high: 'High' },
      countries: ['Tunisia','Morocco','Algeria','Egypt','Saudi Arabia','UAE','Qatar','Kuwait','France','Other'],
      selectCountry: 'Select your country',
    },
    login: {
      title:    'Parents Portal',
      subtitle: 'Track your child\'s progress',
      email:    'Email Address',
      password: 'Password',
      submit:   'Sign In',
      noAccount: "Don't have an account?",
      register: 'Register Now',
      errors: {
        invalid:  'Incorrect email or password',
        network:  'Connection error occurred',
        timeout:  'Connection timed out — check your internet and try again',
      },
    },
  },
} as const
