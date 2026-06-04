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
    // Redis session revocation check
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

export async function createAdminSession(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  await redis.set(`admin_sess:${token}`, '1', { ex: 30 * 24 * 3600 })
  return token
}

export async function verifyAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const result = await redis.get<string>(`admin_sess:${token}`)
  return result === '1'
}

export async function revokeAdminSession(token: string): Promise<void> {
  await redis.del(`admin_sess:${token}`)
}
