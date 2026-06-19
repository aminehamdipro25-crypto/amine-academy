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
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
