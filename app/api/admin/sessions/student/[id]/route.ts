import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { redis } from '@/lib/redis'
import type { SessionLog } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!(await isDashboardUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const appointmentIds = await redis.lrange(`sessions:student:${params.id}`, 0, 29)
    if (appointmentIds.length === 0) return NextResponse.json({ sessions: [], count: 0 })

    const logs = await Promise.all(
      appointmentIds.map(aid => redis.get<SessionLog>(`session-log:${aid}`))
    )
    const sessions = logs.filter(Boolean) as SessionLog[]
    return NextResponse.json({ sessions, count: sessions.length })
  } catch (e) {
    console.error('[admin/sessions/student GET]', e)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
