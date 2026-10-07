import { NextRequest } from 'next/server'
import { safeCompare } from '@/lib/password'
import { addDays, buildIcs, todayIn } from '@/lib/worklog'
import { getWorkSettings, listWork } from '@/lib/worklog-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The calendar the specialist's phone subscribes to. A phone calendar cannot
// send a session cookie, so the secret link IS the credential: 32 random
// bytes, compared in constant time, revocable from the settings tab. It holds
// families' names and addresses — any mismatch answers 404, not a hint.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const clean = token.replace(/\.ics$/, '')
  const settings = await getWorkSettings()
  if (!settings.calendarToken || !safeCompare(clean, settings.calendarToken)) {
    return new Response('Not found', { status: 404 })
  }
  try {
    const [lessons, clients] = await Promise.all([listWork('lessons'), listWork('clients')])
    // Recent past + everything ahead: enough for the phone, without years of history.
    const from = addDays(todayIn(settings.timezone), -60)
    const ics = buildIcs(lessons.filter(l => l.date >= from), clients, settings.timezone)
    return new Response(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="lessons.ics"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[worklog calendar]', e)
    // A 5xx makes calendar apps keep the last good copy instead of emptying it.
    return new Response('Temporarily unavailable', { status: 503 })
  }
}
