import crypto from 'crypto'

// «الدخول بحساب Google» لأولياء الأمور.
//
// Why hand-rolled rather than NextAuth: this project authenticates with its own
// HMAC-signed sessions (lib/auth.ts) and has no NextAuth anywhere. Dropping a
// second session system beside the first, on a platform holding children's
// clinical records, would mean two sources of truth about who is logged in.
// The OAuth code flow is small enough to own outright.
//
// Graceful degradation, the same as Pusher and reCAPTCHA here: without the two
// environment variables `googleEnabled()` is false, the button never renders,
// and the routes answer 503. Nothing else changes.
//
// WHAT THIS DELIBERATELY DOES NOT DO. It never creates an account by itself.
// Google proves who someone is; it does not say that a child has been taken on,
// which family they belong to, or what the intake said. An address with no
// account is sent to the ordinary registration form with the name and email
// filled in — so the specialist's records never sprout empty parent accounts.

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

/** Cookies that carry the one-time values between the two legs of the flow. */
export const STATE_COOKIE = 'g_oauth_state'
export const VERIFIER_COOKIE = 'g_oauth_verifier'
export const REDIRECT_COOKIE = 'g_oauth_next'

/**
 * The client id is NOT a secret — it travels in every authorisation URL and is
 * visible to anyone who opens the consent screen. Only the secret is secret.
 * Putting the id under NEXT_PUBLIC_ lets the login page decide whether to draw
 * the button without a round trip, the same arrangement Pusher uses here.
 *
 * NEXT_PUBLIC_* values are inlined at BUILD time, so adding this in Vercel
 * needs a fresh deploy before the button appears.
 */
export function googleClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
}

/** Server-side: both halves present. */
export function googleEnabled(): boolean {
  return Boolean(googleClientId() && process.env.GOOGLE_CLIENT_SECRET)
}

/** The callback Google redirects back to. Must match the Console exactly. */
export function googleRedirectUri(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/api/auth/google/callback`
}

// ── The one-time values ──────────────────────────────────────────────────

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/** Opaque, unguessable, and checked on return — this is the CSRF defence. */
export function createState(): string {
  return base64url(crypto.randomBytes(32))
}

/**
 * PKCE. The verifier stays in an httpOnly cookie on this device; only its hash
 * travels to Google. An intercepted authorisation code is then useless to
 * anyone who does not also hold the cookie.
 */
export function createVerifier(): string {
  return base64url(crypto.randomBytes(32))
}

export function challengeFor(verifier: string): string {
  return base64url(crypto.createHash('sha256').update(verifier).digest())
}

export function buildAuthUrl(opts: {
  clientId: string
  redirectUri: string
  state: string
  verifier: string
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    // Identity only. No Drive, no contacts, no offline access — this asks for
    // exactly what it needs and a parent can see that on the consent screen.
    scope: 'openid email profile',
    state: opts.state,
    code_challenge: challengeFor(opts.verifier),
    code_challenge_method: 'S256',
    // No refresh token: the session is ours, and we never call Google again.
    access_type: 'online',
    prompt: 'select_account',
  })
  return `${AUTH_ENDPOINT}?${params.toString()}`
}

// ── The claims that come back ────────────────────────────────────────────

export interface GoogleIdentity {
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
}

interface IdTokenClaims {
  iss?: string
  aud?: string
  exp?: number
  email?: string
  email_verified?: boolean | string
  given_name?: string
  family_name?: string
  name?: string
}

/** Decode the payload of a JWT without verifying — see readIdToken. */
export function decodeIdTokenPayload(idToken: string): IdTokenClaims | null {
  const parts = String(idToken ?? '').split('.')
  if (parts.length !== 3) return null
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(padded + '='.repeat((4 - (padded.length % 4)) % 4), 'base64').toString('utf8')
    return JSON.parse(json) as IdTokenClaims
  } catch {
    return null
  }
}

/**
 * Read the identity out of an id_token that came straight from Google's token
 * endpoint, over TLS, in exchange for our client secret.
 *
 * The signature is not re-verified here, and that is deliberate rather than an
 * omission: OpenID Connect allows a client to skip it for a token fetched
 * directly from the token endpoint over a TLS channel it authenticated to —
 * the channel is what establishes the issuer. The claims that DO need checking
 * are checked, because they are what an attacker would swap: the audience must
 * be this application, the issuer must be Google, and the token must not have
 * expired.
 *
 * `email_verified` is the one that matters most. Google will hand out an
 * unverified address for some account types; treating that as proof of the
 * address would let anyone claiming a parent's email walk into that parent's
 * children's records.
 */
export function readIdToken(idToken: string, clientId: string, now = Date.now()): GoogleIdentity | null {
  const claims = decodeIdTokenPayload(idToken)
  if (!claims) return null

  const issuer = String(claims.iss ?? '')
  if (issuer !== 'https://accounts.google.com' && issuer !== 'accounts.google.com') return null
  if (claims.aud !== clientId) return null
  if (typeof claims.exp !== 'number' || claims.exp * 1000 <= now) return null

  const email = String(claims.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return null

  // Google sends this as a boolean, and historically as the string "true".
  const verified = claims.email_verified === true || claims.email_verified === 'true'

  return {
    email,
    emailVerified: verified,
    firstName: String(claims.given_name ?? claims.name ?? '').trim(),
    lastName: String(claims.family_name ?? '').trim(),
  }
}

/** Exchange the authorisation code. Throws with Google's own explanation. */
export async function exchangeCode(opts: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
  verifier: string
}): Promise<{ idToken: string }> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: opts.code,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: opts.verifier,
    }).toString(),
    signal: AbortSignal.timeout(10_000),
  })

  // Checked, not discarded — the platform already had one integration that
  // reported a rejected request as a success.
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Google rejected the code exchange (HTTP ${res.status}): ${detail.slice(0, 300)}`)
  }

  const data = (await res.json()) as { id_token?: string }
  if (!data.id_token) throw new Error('Google returned no id_token')
  return { idToken: data.id_token }
}

// ── What to do with the identity ─────────────────────────────────────────

export type SignInOutcome =
  | { action: 'reject'; reason: 'unverified-email' }
  | { action: 'sign-in'; parentId: string }
  | { action: 'register'; email: string; firstName: string; lastName: string }

/**
 * Decide, given the verified identity and whether an account exists.
 *
 * Matching on the email address is what links a Google sign-in to an existing
 * family, and it is only sound because Google has proved the address belongs to
 * whoever is holding the browser. Without `email_verified` this would be a way
 * to claim any parent's account by naming their address.
 */
export function decideSignIn(
  identity: GoogleIdentity,
  existingParentId: string | null,
): SignInOutcome {
  if (!identity.emailVerified) return { action: 'reject', reason: 'unverified-email' }
  if (existingParentId) return { action: 'sign-in', parentId: existingParentId }
  return {
    action: 'register',
    email: identity.email,
    firstName: identity.firstName,
    lastName: identity.lastName,
  }
}
