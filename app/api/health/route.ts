import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { isDashboardUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Public callers (uptime monitors, load balancers) get only a minimal ok/fail
// signal — no env-var presence flags, no secret lengths, no raw error text.
// The detailed diagnostic view (used for setup troubleshooting) requires a
// dashboard session, matching the gating used by /api/debug and /api/monitor.
export async function GET() {
  let redisOk = false
  try {
    await redis.set('health:ping', 'ok', { ex: 60 })
    redisOk = (await redis.get<string>('health:ping')) === 'ok'
  } catch { /* redisOk stays false */ }

  if (!await isDashboardUser()) {
    return NextResponse.json({ ok: redisOk })
  }

  return NextResponse.json({
    time: new Date().toISOString(),
    ok: redisOk,
    env: {
      AUTH_SECRET:      !!process.env.AUTH_SECRET,
      ADMIN_PASSWORD:   !!process.env.ADMIN_PASSWORD,
      REDIS_URL:        !!process.env.UPSTASH_REDIS_REST_URL,
      REDIS_TOKEN:      !!process.env.UPSTASH_REDIS_REST_TOKEN,
      REDIS_CONFIGURED: redis.isConfigured(),
      GMAIL_USER:       !!process.env.GMAIL_USER,
      GMAIL_PASSWORD:   !!process.env.GMAIL_APP_PASSWORD,
      ANTHROPIC_KEY:    !!process.env.ANTHROPIC_API_KEY,
    },
  })
}
