import { NextResponse } from 'next/server'
import { getAllParents, getStudentsByParent, getStudentGameHistory, getStudentApaRecords } from '@/lib/db'
import { filterApaRecordsByPeriod } from '@/lib/apa-record'
import { sendEmail, weeklyProgressEmail } from '@/lib/mailer'
import { safeCompare } from '@/lib/password'
import { redis } from '@/lib/redis'
import { currentWeekKey } from '@/lib/week'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  const provided = req.headers.get('authorization') ?? ''
  if (!safeCompare(provided, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let parents: Awaited<ReturnType<typeof getAllParents>>
  try {
    parents = await getAllParents()
  } catch (e) {
    console.error('[weekly-report] failed to fetch parents from Redis:', e)
    return NextResponse.json({ error: 'db unavailable' }, { status: 503 })
  }
  const activeParents = parents.filter(p => p.subscriptionStatus === 'active')

  let sent = 0
  let skipped = 0
  let errors = 0

  for (const parent of activeParents) {
    try {
      const students = await getStudentsByParent(parent.id)
      if (students.length === 0) continue

      const studentProgress = await Promise.all(
        students.map(async (student) => {
          const history = await getStudentGameHistory(student.id)
          return { student, history }
        })
      )

      // Gameplay alone was the test for "is there anything to report", which
      // silently excluded every child treated in person: they run no on-screen
      // exercises, so totalPlays is always 0 and the one automated touchpoint
      // never reached their family. Filed APA sessions count as activity too.
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
      const today = new Date().toISOString().slice(0, 10)
      let apaSessionsThisWeek = 0
      for (const { student } of studentProgress) {
        try {
          const records = await getStudentApaRecords(student.id)
          apaSessionsThisWeek += filterApaRecordsByPeriod(records, weekAgo, today).length
        } catch (e) {
          console.error(`[weekly-report] APA lookup failed for ${student.id}:`, e)
        }
      }

      // totalPlays is lifetime, so this gate used to pass forever once a child
      // had played even once — a family that stopped months ago kept receiving
      // a "weekly" email describing a week in which nothing happened. Ask for
      // plays filed in the week we are actually reporting on.
      const thisWeekKey = currentWeekKey()
      const playsThisWeek = studentProgress.some(sp =>
        sp.history.byWeek.some(w => w.week === thisWeekKey && w.gamesPlayed > 0))

      const hasActivity = playsThisWeek || apaSessionsThisWeek > 0
      if (!hasActivity) continue

      // Send once per family per week. send-reminder has always done this; this
      // one did not, so a retry — or a manual re-run after the mail provider
      // failed partway down the list — sent every family that had already been
      // reached a second copy. It also makes a partial run resumable: whoever
      // was reached is skipped, whoever was not is picked up.
      const dedupKey = `weekly-report:${thisWeekKey}:${parent.id}`
      if (await redis.get(dedupKey)) { skipped++; continue }

      const html = weeklyProgressEmail(parent.firstName, studentProgress, apaSessionsThisWeek)
      await sendEmail({
        to: parent.email,
        subject: `📊 تقرير أسبوعي — أكاديمية أمين`,
        html,
      })
      // Only after the send succeeded — marking first would lose a family whose
      // email threw. Ten days, so the key is gone well before the next run.
      await redis.set(dedupKey, '1', { ex: 10 * 24 * 3600 })
      sent++
    } catch (err) {
      console.error(`[weekly-report] failed for ${parent.id}:`, err)
      errors++
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, errors })
}
