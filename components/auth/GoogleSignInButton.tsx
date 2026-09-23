'use client'

// «الدخول بحساب Google».
//
// A link, not a fetch: the OAuth code flow is a full-page journey to Google and
// back, and the two one-time cookies the callback checks are set by the server
// on the way out. Driving it from JavaScript would only be a slower way to do
// the same navigation, with a window in which those cookies do not exist.
//
// Rendered only where the deployment has Google configured. The page passes
// `enabled` from the server so a deployment without the credentials shows no
// button at all rather than one that leads to a 503.

import { useLang, type Lang } from '@/lib/i18n'

const COPY: Record<Lang, { button: string; or: string; errors: Record<string, string> }> = {
  ar: {
    button: 'المتابعة بحساب Google',
    or: 'أو',
    errors: {
      'unverified-email': 'لم تُثبِت Google ملكية هذا البريد، فلا يمكن فتح ملف طفل به. استخدم كلمة المرور أو بريداً مُوثَّقاً.',
      cancelled: 'أُلغي الدخول بحساب Google.',
      'bad-state': 'انتهت صلاحية المحاولة أو فُتحت من جهاز آخر. حاول مرة أخرى.',
      'exchange-failed': 'تعذّر إكمال الدخول مع Google. حاول مرة أخرى.',
      'bad-token': 'ردّ Google غير صالح. حاول مرة أخرى.',
      suspended: 'حسابك موقوف. تواصل مع الأكاديمية.',
      'rate-limited': 'محاولات كثيرة، انتظر قليلاً.',
      disabled: 'الدخول بحساب Google غير مُفعّل.',
      server: 'حدث خطأ في الخادم. حاول مرة أخرى.',
    },
  },
  en: {
    button: 'Continue with Google',
    or: 'or',
    errors: {
      'unverified-email': 'Google has not verified that this address is yours, so it cannot open a child’s file. Use your password, or a verified address.',
      cancelled: 'Google sign-in was cancelled.',
      'bad-state': 'That attempt expired, or was started on another device. Please try again.',
      'exchange-failed': 'Could not complete sign-in with Google. Please try again.',
      'bad-token': 'Google’s response was not valid. Please try again.',
      suspended: 'Your account is suspended. Please contact the academy.',
      'rate-limited': 'Too many attempts — please wait a moment.',
      disabled: 'Google sign-in is not enabled.',
      server: 'Something went wrong. Please try again.',
    },
  },
  fr: {
    button: 'Continuer avec Google',
    or: 'ou',
    errors: {
      'unverified-email': "Google n'a pas vérifié que cette adresse est la vôtre ; elle ne peut donc pas ouvrir le dossier d'un enfant. Utilisez votre mot de passe ou une adresse vérifiée.",
      cancelled: 'Connexion Google annulée.',
      'bad-state': 'Cette tentative a expiré ou a été lancée depuis un autre appareil. Réessayez.',
      'exchange-failed': 'Impossible de terminer la connexion avec Google. Réessayez.',
      'bad-token': 'La réponse de Google est invalide. Réessayez.',
      suspended: 'Votre compte est suspendu. Contactez l’académie.',
      'rate-limited': 'Trop de tentatives — patientez un instant.',
      disabled: 'La connexion Google n’est pas activée.',
      server: 'Une erreur est survenue. Réessayez.',
    },
  },
}

/** Google's mark, inline — the CSP here does not allow an external image host. */
function GoogleMark() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export default function GoogleSignInButton({
  enabled,
  redirect,
  errorCode,
}: {
  enabled: boolean
  /** Where to land after signing in; validated again on the server. */
  redirect?: string
  /** `?googleError=` from a failed attempt, so the reason is not swallowed. */
  errorCode?: string | null
}) {
  const { lang } = useLang()
  const L = (lang as Lang) in COPY ? (lang as Lang) : 'ar'
  const c = COPY[L]

  if (!enabled) return null

  const href = `/api/auth/google/start${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`
  const message = errorCode ? (c.errors[errorCode] ?? c.errors.server) : null

  return (
    <div className="mt-5">
      {message && (
        <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl mb-4">
          {message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4" aria-hidden="true">
        <span className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-400 font-bold">{c.or}</span>
        <span className="h-px bg-gray-200 flex-1" />
      </div>

      <a
        href={href}
        className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition-colors"
      >
        <GoogleMark />
        {c.button}
      </a>
    </div>
  )
}
