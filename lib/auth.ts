import crypto from 'crypto'
import { redis } from './redis'
import type { SessionPayload, UserRole } from './types'

// ── Token Generation ─────────────────────────────────────────

export function generateId(prefix: 'AA' | 'AS' | 'AE' | 'AP'): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`
}

export function createToken(id: string, role: UserRole): string {
  const SECRET = process.env.AUTH_SECRET
  if (!SECRET) throw new Error('AUTH_SECRET not configured')
  const sessionId = crypto.randomBytes(16).toString('hex')
  const payload: SessionPayload = {
    id,
    role,
    sessionId,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
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
    const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
    const a = Buffer.from(sig, 'base64url')
    const b = Buffer.from(expected, 'base64url')
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (payload.exp < Date.now()) return null
    const storedSession = await redis.get<string>(`sess:${payload.id}`)
    if (storedSession !== payload.sessionId) return null
    return payload
  } catch { return null }
}

// ── Session Management ───────────────────────────────────────

export async function createSession(id: string, role: UserRole): Promise<string> {
  const token = createToken(id, role)
  const [data] = token.split('.')
  const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString())
  await redis.set(`sess:${id}`, payload.sessionId, { ex: 30 * 24 * 3600 })
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
  const SECRET = process.env.AUTH_SECRET
  if (!SECRET) throw new Error('AUTH_SECRET not configured')
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
