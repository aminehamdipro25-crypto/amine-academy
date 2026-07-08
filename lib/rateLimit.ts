import { redis } from './redis'

export interface RateLimitResult {
  /** true if the caller genuinely exceeded the limit */
  limited: boolean
  /** true if we couldn't reach Redis to check — distinct from a real rate limit */
  unavailable: boolean
}

export async function isRateLimited(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!redis.isConfigured()) return { limited: true, unavailable: true }  // fail closed

  const redisKey = `rl:${key}`
  try {
    const results = await redis.pipeline([
      ['SET', redisKey, '0', 'NX', 'EX', String(windowSeconds)],
      ['INCR', redisKey],
    ])
    const count = (results[1]?.result as number) ?? 0
    return { limited: count > maxRequests, unavailable: false }
  } catch {
    return { limited: true, unavailable: true }
  }
}

export function getClientIp(req: Request): string {
  // Vercel's edge sets/appends the true client IP as it proxies the request —
  // it does NOT strip a spoofed X-Forwarded-For an attacker sends; it appends
  // its own hop after it. Taking the FIRST entry (as this used to) trusts
  // whatever the client claims, letting anyone bypass every rate limit in the
  // app (admin login, activation codes, etc.) by sending a fresh
  // X-Forwarded-For value on each request. x-real-ip is set directly by
  // Vercel's proxy and is not client-settable — prefer it; otherwise take the
  // LAST X-Forwarded-For entry, which is the one Vercel's own edge appended.
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return 'unknown'
}
