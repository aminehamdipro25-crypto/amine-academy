import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { getParentByEmail, updateParent } from '@/lib/db'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { sanitizePersonName } from '@/lib/person-name'
import {
  REDIRECT_COOKIE,
  STATE_COOKIE,
  VERIFIER_COOKIE,
  decideSignIn,
  exchangeCode,
  googleClientId,
  googleEnabled,
  googleRedirectUri,
  readIdToken,
} from '@/lib/google-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Back to the login page carrying a reason the user can actually read. */
function fail(origin: string, code: string) {
  const res = NextResponse.redirect(`${origin}/parent/login?googleError=${encodeURIComponent(code)}`, 302)
  for (const c of [STATE_COOKIE, VERIFIER_COOKIE, REDIRECT_COOKIE]) {
    res.cookies.set(c, '', { path: '/', maxAge: 0 })
  }
  return res
}

/**
 * Leg two: Google sends the parent back here.
 *
 * Nothing is trusted from the query string on its own. The `state` has to match
 * the cookie this browser was given, the code is exchanged server-side with the
 * PKCE verifier, and the identity is taken from the id_token's checked claims —
 * never from anything the redirect itself carried.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const origin = url.origin

  if (!googleEnabled()) return fail(origin, 'disabled')

  const rl = await isRateLimited(`google_cb:${getClientIp(req)}`, 30, 600)
  if (rl.limited) return fail(origin, 'rate-limited')

  // The parent pressed "cancel" on Google's consent screen, or Google refused.
  if (url.searchParams.get('error')) return fail(origin, 'cancelled')

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieState = req.cookies.get(STATE_COOKIE)?.value
  const verifier = req.cookies.get(VERIFIER_COOKIE)?.value
  const next = safeRedirectPath(req.cookies.get(REDIRECT_COOKIE)?.value ?? null, '/parent')

  // A returned state that does not match the one this browser was handed means
  // the response did not originate from a flow this browser started.
  if (!code || !state || !cookieState || state !== cookieState || !verifier) {
    return fail(origin, 'bad-state')
  }

  let identity
  try {
    const { idToken } = await exchangeCode({
      code,
      clientId: googleClientId()!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: googleRedirectUri(origin),
      verifier,
    })
    identity = readIdToken(idToken, googleClientId()!)
  } catch (e) {
    console.error('[auth/google/callback]', e)
    return fail(origin, 'exchange-failed')
  }
  if (!identity) return fail(origin, 'bad-token')

  let existing
  try {
    existing = await getParentByEmail(identity.email)
  } catch (e) {
    console.error('[auth/google/callback] lookup failed', e)
    return fail(origin, 'server')
  }

  const outcome = decideSignIn(identity, existing?.id ?? null)

  // Google will hand out an address it has not verified for some account types.
  // Treating that as proof would let anyone naming a parent's address walk into
  // that parent's children's records.
  if (outcome.action === 'reject') return fail(origin, 'unverified-email')

  if (outcome.action === 'register') {
    // No account yet. Google has proved who they are; it has not said that a
    // child has been taken on. They go to the ordinary registration form with
    // the name and address filled in, so the specialist's records never sprout
    // empty parent accounts.
    const q = new URLSearchParams({
      email: identity.email,
      firstName: sanitizePersonName(identity.firstName),
      lastName: sanitizePersonName(identity.lastName),
      via: 'google',
    })
    const res = NextResponse.redirect(`${origin}/register?${q.toString()}`, 302)
    for (const c of [STATE_COOKIE, VERIFIER_COOKIE, REDIRECT_COOKIE]) {
      res.cookies.set(c, '', { path: '/', maxAge: 0 })
    }
    return res
  }

  // An account exists. The same gates the password login applies, applied here
  // too — Google proving the address must not become a way past a suspension.
  if (!existing) return fail(origin, 'server')
  if (existing.subscriptionStatus === 'suspended') return fail(origin, 'suspended')

  // Signing in with Google IS proof of the address, so an account that was
  // waiting on an emailed activation code is now verified — the code existed to
  // establish exactly this, and asking for it again would be asking a parent to
  // prove something already proved.
  if (!existing.emailVerified || existing.subscriptionStatus === 'pending') {
    try {
      await updateParent(existing.id, {
        emailVerified: true,
        ...(existing.subscriptionStatus === 'pending' ? { subscriptionStatus: 'active' as const } : {}),
      })
    } catch (e) {
      console.error('[auth/google/callback] could not mark verified', e)
      return fail(origin, 'server')
    }
  }

  const token = await createSession(existing.id, 'parent')
  await audit({
    action: 'login',
    actorId: existing.id,
    actorRole: 'parent',
    ip: getClientIp(req),
    meta: { method: 'google' },
  })

  const res = NextResponse.redirect(`${origin}${next}`, 302)
  res.cookies.set('parent_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 3600,
    path: '/',
  })
  for (const c of [STATE_COOKIE, VERIFIER_COOKIE, REDIRECT_COOKIE]) {
    res.cookies.set(c, '', { path: '/', maxAge: 0 })
  }
  return res
}
