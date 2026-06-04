import crypto from 'crypto'

// N=16384 (OWASP minimum) — N=65536 exceeds OpenSSL memory limit on Vercel serverless
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 }
const KEY_LEN   = 64
const SALT_BYTES = 32

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex')
  const hash = crypto.scryptSync(plain, salt, KEY_LEN, SCRYPT_PARAMS).toString('hex')
  return `scrypt2$${salt}$${hash}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored?.startsWith('scrypt2$')) return false
  const [, salt, hash] = stored.split('$')
  try {
    const testHash = crypto.scryptSync(plain, salt, KEY_LEN, SCRYPT_PARAMS).toString('hex')
    const a = Buffer.from(testHash, 'hex')
    const b = Buffer.from(hash, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch { return false }
}
