// Redis HTTP client — بدون SDK، يعمل في Vercel Edge

interface RedisCfg { url: string; token: string }

function getCfg(): RedisCfg | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  return (url && token) ? { url: url.replace(/\/$/, ''), token } : null
}

async function redisCmd(cfg: RedisCfg, ...args: unknown[]): Promise<unknown> {
  const res = await fetch(`${cfg.url}/${(args as string[]).map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`)
  const { result } = await res.json()
  return result
}

async function redisPipeline(cfg: RedisCfg, commands: unknown[][]): Promise<{ result: unknown }[]> {
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Redis pipeline HTTP ${res.status}`)
  return res.json()
}

// Double JSON.parse — Upstash يعيد بيانات مُشفَّرة مرتين أحياناً
function parseEntry<T>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null
  try {
    let v = raw
    if (typeof v === 'string') v = JSON.parse(v)
    if (typeof v === 'string') v = JSON.parse(v)
    return v && typeof v === 'object' ? (v as T) : null
  } catch { return null }
}

export const redis = {
  async get<T>(key: string): Promise<T | null> {
    const cfg = getCfg()
    if (!cfg) return null
    const raw = await redisCmd(cfg, 'GET', key)
    return parseEntry<T>(raw)
  },

  async set(key: string, value: unknown, opts?: { ex?: number; nx?: boolean }): Promise<void> {
    const cfg = getCfg()
    if (!cfg) throw new Error('Redis not configured')
    const args: unknown[] = ['SET', key, JSON.stringify(value)]
    if (opts?.ex) args.push('EX', opts.ex)
    if (opts?.nx) args.push('NX')
    await redisCmd(cfg, ...args)
  },

  async del(key: string): Promise<void> {
    const cfg = getCfg()
    if (!cfg) return
    await redisCmd(cfg, 'DEL', key)
  },

  async lpush(key: string, value: string): Promise<void> {
    const cfg = getCfg()
    if (!cfg) return
    await redisCmd(cfg, 'LPUSH', key, value)
  },

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const cfg = getCfg()
    if (!cfg) return []
    const result = await redisCmd(cfg, 'LRANGE', key, String(start), String(stop))
    return Array.isArray(result) ? result : []
  },

  async incr(key: string): Promise<number> {
    const cfg = getCfg()
    if (!cfg) return 0
    return (await redisCmd(cfg, 'INCR', key)) as number
  },

  async expire(key: string, seconds: number): Promise<void> {
    const cfg = getCfg()
    if (!cfg) return
    await redisCmd(cfg, 'EXPIRE', key, String(seconds))
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
