// Client-side reCAPTCHA v3 token retrieval. No-ops (returns '') when
// NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set, so the app works unchanged until
// the keys are configured. The server (lib/recaptcha.ts) does the actual
// verification; this just produces a token to send along with the request.

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

interface Grecaptcha {
  ready: (cb: () => void) => void
  execute: (siteKey: string, opts: { action: string }) => Promise<string>
}
declare global {
  interface Window { grecaptcha?: Grecaptcha }
}

let loadPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (typeof window === 'undefined' || !SITE_KEY) return Promise.resolve()
  if (window.grecaptcha) return Promise.resolve()
  if (loadPromise) return loadPromise
  loadPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('recaptcha-load-failed'))
    document.head.appendChild(s)
  })
  return loadPromise
}

export function recaptchaEnabled(): boolean {
  return !!SITE_KEY
}

// Warm the script up ahead of submit so getRecaptchaToken() is instant.
export function preloadRecaptcha(): void {
  if (SITE_KEY) loadScript().catch(() => {})
}

export async function getRecaptchaToken(action: string): Promise<string> {
  if (typeof window === 'undefined' || !SITE_KEY) return ''
  try {
    await loadScript()
    const grecaptcha = window.grecaptcha
    if (!grecaptcha) return ''
    await new Promise<void>(res => grecaptcha.ready(() => res()))
    return await grecaptcha.execute(SITE_KEY, { action })
  } catch {
    // Fail open on the client — the server still enforces honeypot + timing.
    return ''
  }
}
