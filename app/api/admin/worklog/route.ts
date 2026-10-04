import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { addDays } from '@/lib/worklog'
import { listWork, loadAllWork } from '@/lib/worklog-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The whole private-lesson ledger in one read. It is one person's practice —
// tens of families, a few hundred lessons a year — so the page computes every
// statistic locally instead of asking the server one question per chart.
// Owner only: these are the specialist's own earnings and families' addresses.
//
// ?scope=upcoming — just the scheduled lessons around today and who they are
// with: what the reminder watcher polls from every dashboard page.
export async function GET(req: NextRequest) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    if (req.nextUrl.searchParams.get('scope') === 'upcoming') {
      const since = addDays(new Date().toISOString().slice(0, 10), -1)
      const [lessons, clients] = await Promise.all([listWork('lessons'), listWork('clients')])
      const upcoming = lessons.filter(l => l.status === 'scheduled' && l.date >= since && l.reminderMin !== null)
      const ids = new Set(upcoming.map(l => l.clientId))
      return NextResponse.json({
        lessons: upcoming,
        clients: clients.filter(c => ids.has(c.id)).map(c => ({ id: c.id, name: c.name, childName: c.childName, address: c.address })),
      }, { headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json(await loadAllWork(), { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[worklog GET]', e)
    return NextResponse.json({ error: 'تعذّر تحميل الدفتر — حاول مجدداً' }, { status: 500 })
  }
}
