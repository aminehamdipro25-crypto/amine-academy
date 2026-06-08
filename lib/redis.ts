// Redis HTTP client — no SDK, works in Vercel Edge and Node.js

interface RedisCfg { url: string; token: string }

function getCfg(): RedisCfg | null {
  const rawUrl   = process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!rawUrl || !rawToken) return null
  // Strip accidental quotes/whitespace from Vercel env var copy-paste
  const url   = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/\/$/, '')
  const token = rawToken.trim().replace(/^["']|["']$/g, '')
  return { url, token }
}

async function timedFetch(url: string, opts: RequestInit, ms = 8000): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(id)
  }
}

async function redisCmd(cfg: RedisCfg, ...args: unknown[]): Promise<unknown> {
  const res = await timedFetch(
    `${cfg.url}/${(args as string[]).map(encodeURIComponent).join('/')}`,
    { headers: { Authorization: `Bearer ${cfg.token}` }, cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}: ${cfg.url}`)
  const { result } = await res.json()
  return result
}

async function redisPipeline(cfg: RedisCfg, commands: unknown[][]): Promise<{ result: unknown }[]> {
  const res = await timedFetch(`${cfg.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Redis pipeline HTTP ${res.status}`)
  return res.json()
}

// Upstash REST wraps stored values as JSON strings — parse once (or twice when double-encoded)
function parseEntry<T>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== 'string') return raw as T
  let v: unknown
  try { v = JSON.parse(raw) } catch { return raw as T }
  if (typeof v === 'string') {
    try {
      const v2 = JSON.parse(v)
      // Only accept double-parse if result is object/array — never coerce "572180" → 572180
      if (v2 !== null && typeof v2 === 'object') v = v2
    } catch { /* keep single-parsed string */ }
  }
  if (v === null || v === undefined) return null
  return v as T
}

export const redis = {
  async get<T>(key: string): Promise<T | null> {
    const cfg = getCfg()
    if (!cfg) return null
    try {
      const raw = await redisCmd(cfg, 'GET', key)
      return parseEntry<T>(raw)
    } catch (e) {
      console.error(`[redis.get] ${key}:`, (e as Error).message)
      return null
    }
  },

  async set(key: string, value: unknown, opts?: { ex?: number; nx?: boolean }): Promise<void> {
    const cfg = getCfg()
    if (!cfg) throw new Error('Redis not configured')
    // Use pipeline (POST body) to avoid URL length limits for large JSON values
    const cmd: unknown[] = ['SET', key, JSON.stringify(value)]
    if (opts?.ex) { cmd.push('EX'); cmd.push(opts.ex) }
    if (opts?.nx) cmd.push('NX')
    await redisPipeline(cfg, [cmd])
  },

  async del(key: string): Promise<void> {
    const cfg = getCfg()
    if (!cfg) return
    try { await redisCmd(cfg, 'DEL', key) } catch { /* non-critical */ }
  },

  async lpush(key: string, value: string): Promise<void> {
    const cfg = getCfg()
    if (!cfg) return
    await redisCmd(cfg, 'LPUSH', key, value)
  },

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const cfg = getCfg()
    if (!cfg) return []
    try {
      const result = await redisCmd(cfg, 'LRANGE', key, String(start), String(stop))
      return Array.isArray(result) ? result : []
    } catch (e) {
      console.error(`[redis.lrange] ${key}:`, (e as Error).message)
      return []
    }
  },

  async incr(key: string): Promise<number> {
    const cfg = getCfg()
    if (!cfg) return 0
    try {
      return (await redisCmd(cfg, 'INCR', key)) as number
    } catch { return 0 }
  },

  async expire(key: string, seconds: number): Promise<void> {
    const cfg = getCfg()
    if (!cfg) return
    try { await redisCmd(cfg, 'EXPIRE', key, String(seconds)) } catch { /* non-critical */ }
  },

  async pipeline(commands: unknown[][]): Promise<{ result: unknown }[]> {
    const cfg = getCfg()
    if (!cfg) throw new Error('Redis not configured')
    return redisPipeline(cfg, commands)
  },

  isConfigured(): boolean {
    return getCfg() !== null
  },
}
