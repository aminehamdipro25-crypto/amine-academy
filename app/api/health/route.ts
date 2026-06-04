import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const status: Record<string, unknown> = {
    time: new Date().toISOString(),
    env: {
      AUTH_SECRET:      !!process.env.AUTH_SECRET,
      ADMIN_PASSWORD:   !!process.env.ADMIN_PASSWORD,
      REDIS_URL:        !!process.env.UPSTASH_REDIS_REST_URL,
      REDIS_TOKEN:      !!process.env.UPSTASH_REDIS_REST_TOKEN,
      REDIS_URL_LEN:    process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/^["']|["']$/g, '').length ?? 0,
      REDIS_TOKEN_LEN:  process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/^["']|["']$/g, '').length ?? 0,
      REDIS_CONFIGURED: redis.isConfigured(),
    },
    redis: { ok: false, error: null as string | null },
  }

  try {
    await redis.set('health:ping', 'ok', { ex: 60 })
    const val = await redis.get<string>('health:ping')
    status.redis = { ok: val === 'ok', returned: val }
  } catch (e) {
    status.redis = { ok: false, error: (e as Error).message }
  }

  return NextResponse.json(status)
}
