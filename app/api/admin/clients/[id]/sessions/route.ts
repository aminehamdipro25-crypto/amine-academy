import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getStudentsByParent } from '@/lib/db'
import { redis } from '@/lib/redis'
import type { SessionLog } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!(await isDashboardUser())) {
    return NextResponse.json({ sessions: {} }, { status: 401 })
  }
  try {
    const students = await getStudentsByParent(params.id)
    const allLogs: SessionLog[] = []

    await Promise.all(students.map(async (student) => {
      const appointmentIds = await redis.lrange(`sessions:student:${student.id}`, 0, 100)
      const logs = await Promise.all(
        appointmentIds.map(aid => redis.get<SessionLog>(`session-log:${aid}`))
      )
      allLogs.push(...(logs.filter(Boolean) as SessionLog[]))
    }))

    const sessionsMap: Record<string, SessionLog> = {}
    for (const log of allLogs) {
      sessionsMap[log.appointmentId] = log
    }

    return NextResponse.json({ sessions: sessionsMap })
  } catch (e) {
    console.error('[client sessions GET]', e)
    return NextResponse.json({ sessions: {} })
  }
}
