import crypto from 'crypto'
import { redis } from '@/lib/redis'

// ── Amine Languages — learner session auth ───────────────────────────────────
// Isolated from the therapy parent/student/admin auth: its own cookie
// (learner_token), its own Redis session namespace (learner_sess:<id>), and the
// same HMAC + server-side-session scheme. verifyLearnerToken uses Web Crypto so
// it runs in Edge middleware, mirroring lib/auth.ts verifyToken.

export interface LearnerPayload { id: string; sessionId: string; exp: number }
const TTL_MS = 30 * 24 * 60 * 60 * 1000
export const LEARNER_COOKIE = 'learner_token'

export function createLearnerToken(id: string): { token: string; sessionId: string; exp: number } {
  const SECRET = process.env.AUTH_SECRET
  if (!SECRET) throw new Error('AUTH_SECRET not set')
  const sessionId = crypto.randomBytes(16).toString('hex')
  const payload: LearnerPayload = { id, sessionId, exp: Date.now() + TTL_MS }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return { token: `${data}.${sig}`, sessionId, exp: payload.exp }
}

export async function createLearnerSession(id: string): Promise<string> {
  const { token, sessionId } = createLearnerToken(id)
  await redis.set(`learner_sess:${id}`, sessionId, { ex: Math.floor(TTL_MS / 1000) })
  return token
}

export async function revokeLearnerSession(id: string): Promise<void> {
  await redis.del(`learner_sess:${id}`)
}

export async function verifyLearnerToken(token: string | undefined): Promise<LearnerPayload | null> {
  if (!token) return null
  const SECRET = process.env.AUTH_SECRET
  if (!SECRET) return null
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null

    const enc = new TextEncoder()
    const key = await globalThis.crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const rawSig = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(data))
    const sigBytes = new Uint8Array(rawSig)
    let binary = ''
    for (let i = 0; i < sigBytes.length; i++) binary += String.fromCharCode(sigBytes[i])
    const expected = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    if (sig.length !== expected.length) return null
    let diff = 0
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
    if (diff !== 0) return null

    const padded = data.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(padded + '='.repeat((4 - padded.length % 4) % 4))
    const payload: LearnerPayload = JSON.parse(decoded)
    if (payload.exp < Date.now()) return null

    const stored = await redis.get<string>(`learner_sess:${payload.id}`)
    if (stored !== payload.sessionId) return null
    return payload
  } catch { return null }
}
