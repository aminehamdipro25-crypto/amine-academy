// Signing in with Google reaches children's clinical records, so what is tested
// here is not "does the URL build" — it is every place the flow could be talked
// into trusting something it should not:
//
//   • an id_token minted for a different application,
//   • an expired one,
//   • one whose issuer is not Google,
//   • an address Google has NOT verified — which is the one that would let
//     anyone naming a parent's email walk into that parent's records.
import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import {
  buildAuthUrl,
  challengeFor,
  createState,
  createVerifier,
  decideSignIn,
  decodeIdTokenPayload,
  googleRedirectUri,
  readIdToken,
} from '../lib/google-oauth'

const CLIENT_ID = '1234.apps.googleusercontent.com'
const NOW = Date.UTC(2026, 8, 23, 12, 0, 0)

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/** A token shaped like Google's. The signature is never inspected. */
function idToken(claims: Record<string, unknown>): string {
  return `${b64url({ alg: 'RS256' })}.${b64url({
    iss: 'https://accounts.google.com',
    aud: CLIENT_ID,
    exp: Math.floor(NOW / 1000) + 3600,
    email: 'parent@example.com',
    email_verified: true,
    given_name: 'سارة',
    family_name: 'بن صالح',
    ...claims,
  })}.signature`
}

describe('the token is only believed when its claims check out', () => {
  it('accepts a well-formed token from Google for this application', () => {
    const id = readIdToken(idToken({}), CLIENT_ID, NOW)!
    expect(id.email).toBe('parent@example.com')
    expect(id.emailVerified).toBe(true)
    expect(id.firstName).toBe('سارة')
    expect(id.lastName).toBe('بن صالح')
  })

  it('refuses a token minted for a different application', () => {
    expect(readIdToken(idToken({ aud: 'someone-elses-client-id' }), CLIENT_ID, NOW)).toBeNull()
  })

  it('refuses an expired token', () => {
    expect(readIdToken(idToken({ exp: Math.floor(NOW / 1000) - 1 }), CLIENT_ID, NOW)).toBeNull()
  })

  it('refuses a token that does not claim to come from Google', () => {
    expect(readIdToken(idToken({ iss: 'https://accounts.evil.example' }), CLIENT_ID, NOW)).toBeNull()
  })

  it('accepts both spellings of the issuer Google actually sends', () => {
    for (const iss of ['https://accounts.google.com', 'accounts.google.com']) {
      expect(readIdToken(idToken({ iss }), CLIENT_ID, NOW), iss).not.toBeNull()
    }
  })

  it('refuses a token with no usable email', () => {
    expect(readIdToken(idToken({ email: '' }), CLIENT_ID, NOW)).toBeNull()
    expect(readIdToken(idToken({ email: 'not-an-address' }), CLIENT_ID, NOW)).toBeNull()
  })

  it('lower-cases the address, because that is the account key', () => {
    expect(readIdToken(idToken({ email: 'Parent@Example.COM' }), CLIENT_ID, NOW)!.email)
      .toBe('parent@example.com')
  })

  it('reads email_verified whether Google sends a boolean or the string', () => {
    expect(readIdToken(idToken({ email_verified: true }), CLIENT_ID, NOW)!.emailVerified).toBe(true)
    expect(readIdToken(idToken({ email_verified: 'true' }), CLIENT_ID, NOW)!.emailVerified).toBe(true)
    expect(readIdToken(idToken({ email_verified: false }), CLIENT_ID, NOW)!.emailVerified).toBe(false)
    // Absent is not verified.
    expect(readIdToken(idToken({ email_verified: undefined }), CLIENT_ID, NOW)!.emailVerified).toBe(false)
  })

  it('survives rubbish instead of throwing', () => {
    for (const bad of ['', 'not.a.token', 'a.b', '...', 'x'.repeat(200)]) {
      expect(() => readIdToken(bad, CLIENT_ID, NOW)).not.toThrow()
      expect(readIdToken(bad, CLIENT_ID, NOW), bad.slice(0, 12)).toBeNull()
    }
    expect(decodeIdTokenPayload('a.!!!.c')).toBeNull()
  })
})

describe('an unverified address never reaches an account', () => {
  const unverified = { email: 'parent@example.com', emailVerified: false, firstName: 'س', lastName: 'ب' }

  it('is rejected even when an account with that address exists', () => {
    expect(decideSignIn(unverified, 'AA-existing')).toEqual({ action: 'reject', reason: 'unverified-email' })
  })

  it('is rejected before it can start a registration either', () => {
    expect(decideSignIn(unverified, null).action).toBe('reject')
  })
})

describe('a verified address', () => {
  const verified = { email: 'parent@example.com', emailVerified: true, firstName: 'سارة', lastName: 'بن صالح' }

  it('signs in to the matching account', () => {
    expect(decideSignIn(verified, 'AA-123')).toEqual({ action: 'sign-in', parentId: 'AA-123' })
  })

  it('never creates an account on its own — it offers registration', () => {
    // Google proves identity; it does not say a child has been taken on. An
    // account made here would have no child, no concerns and no intake.
    const out = decideSignIn(verified, null)
    expect(out.action).toBe('register')
    expect(out).toMatchObject({ email: 'parent@example.com', firstName: 'سارة' })
  })
})

describe('the one-time values', () => {
  it('gives a different state and verifier every time', () => {
    const states = new Set(Array.from({ length: 50 }, createState))
    const verifiers = new Set(Array.from({ length: 50 }, createVerifier))
    expect(states.size).toBe(50)
    expect(verifiers.size).toBe(50)
  })

  it('makes them long enough to be unguessable', () => {
    // 32 random bytes, base64url — the CSRF and PKCE defences both rest on this.
    expect(createState().length).toBeGreaterThanOrEqual(43)
    expect(createVerifier().length).toBeGreaterThanOrEqual(43)
  })

  it('uses url-safe characters only, so nothing is mangled in transit', () => {
    for (const v of [createState(), createVerifier()]) {
      expect(v).toMatch(/^[A-Za-z0-9_-]+$/)
    }
  })

  it('sends the hash of the verifier, never the verifier', () => {
    const verifier = createVerifier()
    const expected = crypto.createHash('sha256').update(verifier).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    expect(challengeFor(verifier)).toBe(expected)

    const url = buildAuthUrl({
      clientId: CLIENT_ID,
      redirectUri: 'https://example.com/api/auth/google/callback',
      state: 'ST',
      verifier,
    })
    expect(url).not.toContain(verifier)
    expect(url).toContain(encodeURIComponent(expected))
  })
})

describe('the authorisation request asks for the least it can', () => {
  const url = new URL(buildAuthUrl({
    clientId: CLIENT_ID,
    redirectUri: 'https://example.com/api/auth/google/callback',
    state: 'ST',
    verifier: 'VER',
  }))

  it('requests identity scopes and nothing else', () => {
    expect(url.searchParams.get('scope')).toBe('openid email profile')
  })

  it('asks for no offline access — the session is ours, not Google\'s', () => {
    expect(url.searchParams.get('access_type')).toBe('online')
  })

  it('uses the authorisation code flow with S256', () => {
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
  })

  it('goes to Google', () => {
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
  })
})

describe('the redirect URI', () => {
  it('is built from the request origin, with no double slash', () => {
    expect(googleRedirectUri('https://amine-academy.vercel.app'))
      .toBe('https://amine-academy.vercel.app/api/auth/google/callback')
    expect(googleRedirectUri('https://amine-academy.vercel.app/'))
      .toBe('https://amine-academy.vercel.app/api/auth/google/callback')
  })
})
