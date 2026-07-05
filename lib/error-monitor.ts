import { redis } from './redis'

export interface ErrorEvent {
  id:        string
  message:   string
  stack?:    string
  url?:      string
  userAgent?: string
  userId?:   string
  role?:     string
  ts:        string
  level:     'error' | 'warning'
}

export async function logError(event: Omit<ErrorEvent, 'id' | 'ts'>): Promise<void> {
  try {
    const entry: ErrorEvent = {
      ...event,
      id: `ERR-${Date.now().toString(36)}`,
      ts: new Date().toISOString(),
    }
    // Keep last 200 errors, TTL 30 days
    await redis.pipeline([
      ['LPUSH', 'error-log', JSON.stringify(entry)],
      ['LTRIM', 'error-log', 0, 199],
      ['EXPIRE', 'error-log', 30 * 24 * 3600],
    ])
  } catch { /* never let monitoring break the app */ }
}

export async function getErrors(limit = 50): Promise<ErrorEvent[]> {
  try {
    const raw = await redis.lrange('error-log', 0, limit - 1) as string[]
    return raw.map(r => JSON.parse(r) as ErrorEvent)
  } catch { return [] }
}
