// Google reCAPTCHA v3 server-side verification.
//
// Graceful degradation (same philosophy as Pusher in this project): if
// RECAPTCHA_SECRET_KEY is not configured, verification is skipped and the
// caller falls back to the always-on honeypot + submit-timing checks. Setting
// the two env keys in Vercel activates reCAPTCHA with no code change:
//   NEXT_PUBLIC_RECAPTCHA_SITE_KEY  (client — used by the widget loader)
//   RECAPTCHA_SECRET_KEY            (server — used here, never exposed)

export interface RecaptchaResult {
  ok: boolean          // true = allow the request through
  skipped: boolean     // true = reCAPTCHA not configured; caller relies on other traps
  score?: number       // v3 score 0.0 (bot) … 1.0 (human)
  reason?: string
}

// Requests scoring below this are treated as bots. 0.5 is Google's recommended
// default starting point.
const SCORE_THRESHOLD = 0.5

export async function verifyRecaptcha(token: unknown, expectedAction?: string): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return { ok: true, skipped: true }

  if (typeof token !== 'string' || !token) {
    return { ok: false, skipped: false, reason: 'missing-token' }
  }

  try {
    const params = new URLSearchParams({ secret, response: token })
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      // Never let a slow/broken Google call hang the request path.
      signal: AbortSignal.timeout(5000),
    })
    const data = (await res.json()) as {
      success?: boolean
      score?: number
      action?: string
      'error-codes'?: string[]
    }

    if (!data.success) {
      return { ok: false, skipped: false, reason: (data['error-codes'] || []).join(',') || 'verify-failed' }
    }
    if (expectedAction && data.action && data.action !== expectedAction) {
      return { ok: false, skipped: false, score: data.score, reason: 'action-mismatch' }
    }
    const score = typeof data.score === 'number' ? data.score : 0
    return { ok: score >= SCORE_THRESHOLD, skipped: false, score }
  } catch (e) {
    // Verification service unreachable — fail OPEN so a Google outage can't
    // block real signups; the honeypot + timing traps still apply.
    console.warn('[recaptcha] verify error, failing open:', (e as Error).message)
    return { ok: true, skipped: true, reason: 'verify-unreachable' }
  }
}
