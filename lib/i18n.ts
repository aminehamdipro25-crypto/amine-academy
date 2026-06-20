'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import React from 'react'

export type Lang = 'ar' | 'en' | 'fr'

const STORAGE_KEY = 'aa_lang'

interface LangCtx { lang: Lang; setLang: (l: Lang) => void }
const Ctx = createContext<LangCtx>({ lang: 'ar', setLang: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (saved === 'ar' || saved === 'en' || saved === 'fr') setLangState(saved)
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

// ── 3-way text picker ────────────────────────────────────────
// Usage: pickLang(lang, arabicText, englishText, frenchText)
export function pickLang<T>(lang: Lang, ar: T, en: T, fr: T): T {
  return lang === 'ar' ? ar : lang === 'fr' ? fr : en
}

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
    portal: {
      parentNav: {
        home: 'الرئيسية', children: 'أطفالي', assessment: 'التقييم', exercises: 'التمارين',
        progress: 'التطور', appointments: 'المواعيد', reports: 'التقارير', chat: 'التواصل',
        familyChallenge: 'تحدي العائلة', more: 'المزيد',
      },
      studentNav: {
        home: 'بيتي', exercises: 'تمارين', journal: 'يومياتي', achievements: 'جوائزي', schedule: 'جدولي',
      },
      common: {
        logout: 'خروج', notifications: 'الإشعارات', parentsPortalSubtitle: 'بوابة الأولياء', day: 'يوم',
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
    portal: {
      parentNav: {
        home: 'Home', children: 'My Children', assessment: 'Assessment', exercises: 'Exercises',
        progress: 'Progress', appointments: 'Appointments', reports: 'Reports', chat: 'Messages',
        familyChallenge: 'Family Challenge', more: 'More',
      },
      studentNav: {
        home: 'Home', exercises: 'Exercises', journal: 'Journal', achievements: 'Awards', schedule: 'Schedule',
      },
      common: {
        logout: 'Log out', notifications: 'Notifications', parentsPortalSubtitle: 'Parents Portal', day: 'day',
      },
    },
  },
  fr: {
    nav: {
      trial:    'Essai gratuit',
      parents:  'Espace parents',
      register: "S'inscrire",
      lang:     'ع',
    },
    hero: {
      badge:   'Plateforme mondialement accréditée en activité physique adaptée et psychologie',
      h1a:     'Votre enfant pense',
      h1b:     'différemment',
      h1c:     'et nous parlons son langage',
      desc:    "La première plateforme arabe qui réunit l'activité physique adaptée (APA), l'analyse appliquée du comportement (ABA) et l'entraînement cognitivo-comportemental (TCC) dans des séances interactives en direct pour les enfants TDAH et autistes.",
      ages:    'De 5 à 22 ans • Qatar 🇶🇦, Tunisie 🇹🇳 et monde arabe',
      cta1:    "Réservez votre séance d'évaluation gratuite",
      cta2:    'Découvrez comment se déroule une séance',
      offerLabel: "⏰ L'offre d'inscription anticipée se termine dans",
      units:   { d: 'Jours', h: 'Heures', m: 'Min', s: 'Sec' },
      stats:   { children: 'Enfants accompagnés', years: "Années d'expertise", satisfaction: 'Parents satisfaits' },
    },
    register: {
      title:     'Créer un nouveau compte',
      hasAccount: 'Vous avez déjà un compte ?',
      login:     'Se connecter',
      steps: ['Informations du parent','Informations de l\'enfant','Choix de la formule'],
      next:      'Suivant →',
      prev:      'Retour',
      submit:    "Terminer l'inscription ✓",
      fields: {
        firstName: 'Prénom', lastName: 'Nom de famille',
        email: 'Adresse e-mail', phone: 'Numéro de téléphone (WhatsApp)',
        country: 'Pays', password: 'Mot de passe',
        confirmPassword: 'Confirmer le mot de passe',
        childFirstName: "Prénom de l'enfant", childLastName: 'Nom de famille (facultatif)',
        birthDate: 'Date de naissance', diagnosis: 'Diagnostic',
        severity: 'Degré de sévérité', visualSens: 'Sensibilité visuelle',
        audioSens: 'Sensibilité auditive',
      },
      severity: { 1: 'Léger', 2: 'Modéré', 3: 'Sévère' },
      sensitivity: { low: 'Faible', medium: 'Moyenne', high: 'Élevée' },
      countries: ['Tunisie','Maroc','Algérie','Égypte','Arabie saoudite','Émirats arabes unis','Qatar','Koweït','France','Autre'],
      selectCountry: 'Choisissez votre pays',
    },
    login: {
      title:    'Espace parents',
      subtitle: "Suivez les progrès de votre enfant",
      email:    'Adresse e-mail',
      password: 'Mot de passe',
      submit:   'Se connecter',
      noAccount: "Vous n'avez pas de compte ?",
      register: "S'inscrire",
      errors: {
        invalid:  'E-mail ou mot de passe incorrect',
        network:  'Une erreur de connexion est survenue',
        timeout:  'La connexion a expiré — vérifiez votre connexion et réessayez',
      },
    },
    portal: {
      parentNav: {
        home: 'Accueil', children: 'Mes enfants', assessment: 'Évaluation', exercises: 'Exercices',
        progress: 'Progrès', appointments: 'Rendez-vous', reports: 'Rapports', chat: 'Messages',
        familyChallenge: 'Défi familial', more: 'Plus',
      },
      studentNav: {
        home: 'Accueil', exercises: 'Exercices', journal: 'Journal', achievements: 'Récompenses', schedule: 'Emploi du temps',
      },
      common: {
        logout: 'Déconnexion', notifications: 'Notifications', parentsPortalSubtitle: 'Espace parents', day: 'jour',
      },
    },
  },
} as const
