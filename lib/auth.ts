import crypto from 'crypto'
import { redis } from './redis'
import type { SessionPayload, UserRole } from './types'

// ── Token Generation ─────────────────────────────────────────

// Every session token (parent/student/admin/staff) is only as strong as
// this secret's entropy. This WARNS (server logs only) rather than blocking
// login on a short secret — a hard failure here risks locking every user
// (including the owner) out of a live production platform if the deployed
// secret happens to be shorter than recommended; a one-time log line is a
// safe way to flag it for rotation without any outage risk.
const MIN_AUTH_SECRET_LENGTH = 32
let warnedShortSecret = false
function getAuthSecretForSigning(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET not configured')
  if (secret.length < MIN_AUTH_SECRET_LENGTH && !warnedShortSecret) {
    warnedShortSecret = true
    console.warn(`[auth] AUTH_SECRET is shorter than the recommended ${MIN_AUTH_SECRET_LENGTH} characters — rotate to a longer value when convenient.`)
  }
  return secret
}

export function generateId(prefix: 'AA' | 'AS' | 'AE' | 'AP' | 'AT'): string {
  // 12 random bytes = 96 bits. The appointment id doubles as the capability
  // that protects a child's live session/video, so it must not be guessable.
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(12).toString('hex')}`
}

export function createToken(id: string, role: UserRole, ttlMs: number = 30 * 24 * 60 * 60 * 1000): string {
  const SECRET = getAuthSecretForSigning()
  const sessionId = crypto.randomBytes(16).toString('hex')
  const payload: SessionPayload = {
    id,
    role,
    sessionId,
    exp: Date.now() + ttlMs,
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig  = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

export async function verifyToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  const SECRET = process.env.AUTH_SECRET
  if (!SECRET) return null
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null

    // Use Web Crypto API — compatible with Edge Runtime (middleware) AND Node.js 18+
    const enc = new TextEncoder()
    const key = await globalThis.crypto.subtle.importKey(
      'raw', enc.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    )
    const rawSig   = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(data))
    const sigBytes = new Uint8Array(rawSig)
    // Manual base64url conversion (no padding, - and _ variants)
    let binary = ''
    for (let i = 0; i < sigBytes.length; i++) binary += String.fromCharCode(sigBytes[i])
    const expected = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    // Constant-time comparison
    if (sig.length !== expected.length) return null
    let diff = 0
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
    if (diff !== 0) return null

    // Decode base64url payload without Buffer (Edge-compatible)
    const padded  = data.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(padded + '='.repeat((4 - padded.length % 4) % 4))
    const payload: SessionPayload = JSON.parse(decoded)
    if (payload.exp < Date.now()) return null

    const storedSession = await redis.get<string>(`sess:${payload.id}`)
    if (storedSession !== payload.sessionId) return null
    return payload
  } catch { return null }
}

// ── Session Management ───────────────────────────────────────

export async function createSession(id: string, role: UserRole, ttlSec: number = 30 * 24 * 3600): Promise<string> {
  const token = createToken(id, role, ttlSec * 1000)
  const [data] = token.split('.')
  const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString())
  await redis.set(`sess:${id}`, payload.sessionId, { ex: ttlSec })
  return token
}

export async function revokeSession(id: string): Promise<void> {
  await redis.del(`sess:${id}`)
}

// ── Admin Session ─────────────────────────────────────────────
// Uses globalThis.crypto.subtle (Web Crypto API) — works in Edge Runtime AND Node.js 18+
// This is required because verifyAdminSession is called from middleware (Edge Runtime).

/** HMAC-SHA-256 hex digest via Web Crypto — Edge + Node.js compatible */
async function _webcryptoHmac(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const buf = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Create admin session token — format: `raw64hex.timestamp.hmacHex` */
async function _buildAdminToken(): Promise<string> {
  const SECRET = getAuthSecretForSigning()
  // Raw random component
  const rawBytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(rawBytes)
  const raw = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const ts  = Date.now().toString()
  const sig = await _webcryptoHmac(SECRET, `${raw}.${ts}`)
  return `${raw}.${ts}.${sig}`
}

/** Verify admin token signature — Edge + Node.js compatible */
async function _verifyAdminToken(token: string): Promise<boolean> {
  const SECRET = process.env.AUTH_SECRET
  if (!SECRET || !token) return false
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const [raw, ts, sig] = parts
    if (!raw || !ts || !sig) return false
    if (!/^[a-f0-9]{64}$/.test(raw)) return false
    // Re-compute expected signature
    const expected = await _webcryptoHmac(SECRET, `${raw}.${ts}`)
    // Constant-time string compare
    if (sig.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
    if (diff !== 0) return false
    // Expiry: 30 days
    const age = Date.now() - parseInt(ts, 10)
    if (isNaN(age) || age < 0 || age > 30 * 24 * 60 * 60 * 1000) return false
    return true
  } catch { return false }
}

export async function createAdminSession(): Promise<string> {
  const token = await _buildAdminToken()
  // Redis: optional — for revocation only; login works even if Redis is down
  try {
    const raw = token.split('.')[0]
    await redis.set(`admin_sess:${raw}`, '1', { ex: 30 * 24 * 3600 })
  } catch (e) {
    console.warn('[admin-session] Redis write skipped:', (e as Error).message)
  }
  return token
}

export async function verifyAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  // Primary: HMAC signature — works with no Redis
  if (!(await _verifyAdminToken(token))) return false
  // Secondary: check if explicitly revoked in Redis (optional)
  try {
    const raw = token.split('.')[0]
    const revoked = await redis.get<string>(`admin_revoked:${raw}`)
    if (revoked === 'yes') return false
  } catch { /* Redis unavailable — HMAC already confirmed validity */ }
  return true
}

export async function revokeAdminSession(token: string): Promise<void> {
  const raw = token.split('.')[0]
  if (!raw) return
  try {
    await redis.set(`admin_revoked:${raw}`, 'yes', { ex: 30 * 24 * 3600 })
    await redis.del(`admin_sess:${raw}`)
  } catch { /* cookie deletion on client side is sufficient fallback */ }
}

// ── Staff Session ──────────────────────────────────────────────
// Multi-therapist accounts layered on top of the owner's master
// ADMIN_PASSWORD — same Edge-compatible HMAC design as the admin
// session above, so a staff login still works if Redis is down.
// Format: `staff.<staffId-base64url>.<timestamp>.<hmacHex>`

async function _buildStaffToken(staffId: string): Promise<string> {
  const SECRET = getAuthSecretForSigning()
  const idEnc = btoa(staffId).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const ts  = Date.now().toString()
  const sig = await _webcryptoHmac(SECRET, `staff.${idEnc}.${ts}`)
  return `staff.${idEnc}.${ts}.${sig}`
}

async function _verifyStaffToken(token: string): Promise<{ staffId: string } | null> {
  const SECRET = process.env.AUTH_SECRET
  if (!SECRET || !token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 4 || parts[0] !== 'staff') return null
    const [, idEnc, ts, sig] = parts
    if (!idEnc || !ts || !sig) return null
    const expected = await _webcryptoHmac(SECRET, `staff.${idEnc}.${ts}`)
    if (sig.length !== expected.length) return null
    let diff = 0
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
    if (diff !== 0) return null
    const age = Date.now() - parseInt(ts, 10)
    if (isNaN(age) || age < 0 || age > 30 * 24 * 60 * 60 * 1000) return null
    const padded = idEnc.replace(/-/g, '+').replace(/_/g, '/')
    const staffId = atob(padded + '='.repeat((4 - padded.length % 4) % 4))
    return { staffId }
  } catch { return null }
}

export async function createStaffSession(staffId: string): Promise<string> {
  const token = await _buildStaffToken(staffId)
  try {
    await redis.set(`staff_sess:${staffId}`, '1', { ex: 30 * 24 * 3600 })
  } catch (e) {
    console.warn('[staff-session] Redis write skipped:', (e as Error).message)
  }
  return token
}

export async function verifyStaffSession(token: string | undefined): Promise<{ staffId: string } | null> {
  if (!token) return null
  const parsed = await _verifyStaffToken(token)
  if (!parsed) return null
  try {
    const revoked = await redis.get<string>(`staff_revoked:${parsed.staffId}`)
    if (revoked === 'yes') return null
  } catch { /* Redis unavailable — HMAC already confirmed validity */ }
  return parsed
}

export async function revokeStaffSession(staffId: string): Promise<void> {
  try {
    await redis.set(`staff_revoked:${staffId}`, 'yes', { ex: 30 * 24 * 3600 })
    await redis.del(`staff_sess:${staffId}`)
  } catch { /* cookie deletion on client side is sufficient fallback */ }
}

/** True if the request carries either a valid owner session (admin_token)
 *  or a valid staff session (staff_token) — for routes any logged-in
 *  dashboard user (owner or staff) may call. */
export async function isDashboardUser(): Promise<boolean> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  if (await verifyAdminSession(cookieStore.get('admin_token')?.value)) return true
  const staff = await verifyStaffSession(cookieStore.get('staff_token')?.value)
  return !!staff
}

/** True only for the owner (admin_token) — for routes that grant
 *  account-takeover-level power (impersonation, password resets, permanent
 *  deletion) that must stay out of staff hands even though staff share the
 *  rest of the dashboard. */
export async function isOwnerUser(): Promise<boolean> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return verifyAdminSession(cookieStore.get('admin_token')?.value)
}

/** Stable per-actor identity for the current dashboard caller — 'owner' for
 *  the admin session, `staff:<id>` for a staff session, null if neither.
 *  Used to key per-actor rate limits so one busy account can't exhaust a
 *  quota shared by everyone on the dashboard. */
export async function getDashboardActorId(): Promise<string | null> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  if (await verifyAdminSession(cookieStore.get('admin_token')?.value)) return 'owner'
  const staff = await verifyStaffSession(cookieStore.get('staff_token')?.value)
  return staff ? `staff:${staff.staffId}` : null
}
