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

// ── Admin Session (HMAC-signed — works even without Redis) ────

function _signAdminToken(raw64hex: string): string {
  const SECRET = process.env.AUTH_SECRET
  if (!SECRET) throw new Error('AUTH_SECRET not configured')
  const data = `${raw64hex}.${Date.now()}`
  const sig  = crypto.createHmac('sha256', SECRET).update(data).digest('hex')
  return `${data}.${sig}`
}

function _verifyAdminTokenSignature(token: string): boolean {
  const SECRET = process.env.AUTH_SECRET
  if (!SECRET || !token) return false
  try {
    // token = raw64hex.timestamp.sig
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const [raw, ts, sig] = parts
    if (!raw || !ts || !sig) return false
    // Check format: raw must be 64-char hex
    if (!/^[a-f0-9]{64}$/.test(raw)) return false
    // Verify HMAC
    const data = `${raw}.${ts}`
    const expected = crypto.createHmac('sha256', SECRET).update(data).digest('hex')
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false
    // Check expiry (30 days)
    const age = Date.now() - parseInt(ts, 10)
    if (isNaN(age) || age < 0 || age > 30 * 24 * 60 * 60 * 1000) return false
    return true
  } catch { return false }
}

export async function createAdminSession(): Promise<string> {
  const raw = crypto.randomBytes(32).toString('hex')
  const token = _signAdminToken(raw)
  // Redis: optional — for future revocation capability
  try {
    await redis.set(`admin_sess:${raw}`, '1', { ex: 30 * 24 * 3600 })
  } catch (e) {
    // Redis unavailable — token is still valid by HMAC signature
    console.warn('[admin-session] Redis write skipped:', (e as Error).message)
  }
  return token
}

export async function verifyAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  // Primary gate: HMAC signature (no Redis needed)
  if (!_verifyAdminTokenSignature(token)) return false
  // Secondary: Redis revocation check (optional — don't block if Redis is down)
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
    // Mark as revoked + delete session entry
    await redis.set(`admin_revoked:${raw}`, 'yes', { ex: 30 * 24 * 3600 })
    await redis.del(`admin_sess:${raw}`)
  } catch { /* Redis unavailable — cookie deletion on client side is sufficient */ }
}
