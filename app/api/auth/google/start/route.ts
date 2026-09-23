import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { safeRedirectPath } from '@/lib/safe-redirect'
import {
  REDIRECT_COOKIE,
  STATE_COOKIE,
  VERIFIER_COOKIE,
  buildAuthUrl,
  createState,
  createVerifier,
  googleClientId,
  googleEnabled,
  googleRedirectUri,
} from '@/lib/google-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Leg one: hand the parent to Google, having first written down the two
 * one-time values this device will have to produce on the way back.
 */
export async function GET(req: NextRequest) {
  if (!googleEnabled()) {
    return NextResponse.json(
      { error: 'الدخول بحساب Google غير مُفعّل على هذا النشر' },
      { status: 503 },
    )
  }

  const rl = await isRateLimited(`google_start:${getClientIp(req)}`, 20, 600)
  if (rl.limited) {
    return NextResponse.json({ error: 'محاولات كثيرة، انتظر قليلاً' }, { status: 429 })
  }

  const url = new URL(req.url)
  const state = createState()
  const verifier = createVerifier()

  // Where to land afterwards. Passed through the same guard the password login
  // uses, so an attacker cannot turn a real sign-in into a redirect off-site.
  const next = safeRedirectPath(url.searchParams.get('redirect'), '/parent')

  const target = buildAuthUrl({
    clientId: googleClientId()!,
    redirectUri: googleRedirectUri(url.origin),
    state,
    verifier,
  })

  const res = NextResponse.redirect(target, 302)
  const secure = url.protocol === 'https:'
  // httpOnly: the verifier is what makes an intercepted code useless, so it
  // must never be readable from a script. Ten minutes is longer than any real
  // consent screen and short enough that a stale value cannot be reused.
  const opts = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge: 600 }
  res.cookies.set(STATE_COOKIE, state, opts)
  res.cookies.set(VERIFIER_COOKIE, verifier, opts)
  res.cookies.set(REDIRECT_COOKIE, next, opts)
  return res
}
