import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { sanitizeSettings } from '@/lib/worklog'
import { getWorkSettings, newCalendarToken, saveWorkSettings } from '@/lib/worklog-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PUT { ...settings }                        — save preferences
// PUT { calendar: 'enable' | 'rotate' }      — new secret feed link (the old one stops working)
// PUT { calendar: 'disable' }                — no feed at all
export async function PUT(req: NextRequest) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })
  try {
    const current = await getWorkSettings()
    const s = sanitizeSettings(body, current)
    if (!s.ok) return NextResponse.json({ error: s.error }, { status: 400 })
    const next = { ...s.value }
    if (body.calendar === 'enable' || body.calendar === 'rotate') next.calendarToken = newCalendarToken()
    if (body.calendar === 'disable') delete next.calendarToken
    await saveWorkSettings(next)
    return NextResponse.json(next)
  } catch (e) {
    console.error('[worklog settings PUT]', e)
    return NextResponse.json({ error: 'تعذّر الحفظ — حاول مجدداً' }, { status: 500 })
  }
}
