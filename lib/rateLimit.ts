import { redis } from './redis'

export async function isRateLimited(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  if (!redis.isConfigured()) return true  // fail closed

  const redisKey = `rl:${key}`
  try {
    const results = await redis.pipeline([
      ['SET', redisKey, '0', 'NX', 'EX', String(windowSeconds)],
      ['INCR', redisKey],
    ])
    const count = (results[1]?.result as number) ?? 0
    return count > maxRequests
  } catch { return false }
}

export function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
