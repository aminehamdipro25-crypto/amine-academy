import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

export async function GET() {
  const results: Record<string, string> = {}

  // 1. Check env vars
  results.redis_url    = process.env.UPSTASH_REDIS_REST_URL    ? '✅ set' : '❌ MISSING'
  results.redis_token  = process.env.UPSTASH_REDIS_REST_TOKEN  ? '✅ set' : '❌ MISSING'
  results.auth_secret  = process.env.AUTH_SECRET               ? '✅ set' : '❌ MISSING'
  results.gmail_user   = process.env.GMAIL_USER                ? '✅ set' : '❌ MISSING'
  results.gmail_pass   = process.env.GMAIL_APP_PASSWORD        ? '✅ set' : '❌ MISSING'

  // 2. Test Redis SET + GET
  try {
    await redis.set('debug:ping', { ts: Date.now() }, { ex: 60 })
    results.redis_set = '✅ SET ok'
  } catch (e) {
    results.redis_set = `❌ SET failed: ${(e as Error).message}`
  }

  try {
    const val = await redis.get<{ ts: number }>('debug:ping')
    results.redis_get = val ? `✅ GET ok (ts=${val.ts})` : '⚠️ GET returned null'
  } catch (e) {
    results.redis_get = `❌ GET failed: ${(e as Error).message}`
  }

  // 3. Test pipeline
  try {
    await redis.pipeline([['SET', 'debug:pipe', JSON.stringify({ ok: true }), 'EX', '60']])
    results.redis_pipeline = '✅ pipeline ok'
  } catch (e) {
    results.redis_pipeline = `❌ pipeline failed: ${(e as Error).message}`
  }

  const allOk = Object.values(results).every(v => v.startsWith('✅'))
  return NextResponse.json({ status: allOk ? 'ok' : 'issues found', results }, {
    status: allOk ? 200 : 500,
  })
}
