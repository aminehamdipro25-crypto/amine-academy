import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { getClientIp } from '@/lib/rateLimit'
import {
  getAllParents, getStudentsByParent, getAllExercises, getAllAppointments,
  getAllPendingPayments, getStudentReports, getAssessmentProfile, getStudentGameResults,
} from '@/lib/db'

export const runtime = 'nodejs'

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return verifyAdminSession(token)
}

// Full data dump for manual backup — everything lives only in Upstash Redis
// with no automated snapshotting, so this is the owner's one way to get a
// point-in-time copy of clients/payments/clinical records off-platform.
export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  await audit({ action: 'data_export', actorId: 'owner', actorRole: 'owner', ip: getClientIp(req) })
  try {
    const parents = await getAllParents()
    const [exercises, appointments, payments, students] = await Promise.all([
      getAllExercises(),
      getAllAppointments(),
      getAllPendingPayments(),
      Promise.all(parents.map(p => getStudentsByParent(p.id))).then(r => r.flat()),
    ])

    const [reports, assessmentProfiles, gameResults] = await Promise.all([
      Promise.all(students.map(s => getStudentReports(s.id))).then(r => r.flat()),
      Promise.all(students.map(s => getAssessmentProfile(s.id))).then(r => r.filter(Boolean)),
      Promise.all(students.map(s => getStudentGameResults(s.id))).then(r => r.flat()),
    ])

    // Strip passwordHash — never include hashed credentials in a backup file
    const sanitizedParents = parents.map(({ passwordHash: _ph, ...p }) => p)

    const dump = {
      exportedAt: new Date().toISOString(),
      parents: sanitizedParents, students, exercises, appointments, payments,
      reports, assessmentProfiles, gameResults,
    }

    return new NextResponse(JSON.stringify(dump, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="amine-academy-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (e) {
    console.error('[admin/export GET]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
