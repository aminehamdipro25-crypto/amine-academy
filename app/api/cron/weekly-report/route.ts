import { NextResponse } from 'next/server'
import { getAllParents, getStudentsByParent, getStudentGameHistory, getStudentApaRecords } from '@/lib/db'
import { filterApaRecordsByPeriod } from '@/lib/apa-record'
import { sendEmail, weeklyProgressEmail } from '@/lib/mailer'
import { safeCompare } from '@/lib/password'
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

      const html = weeklyProgressEmail(parent.firstName, studentProgress, apaSessionsThisWeek)
      await sendEmail({
        to: parent.email,
        subject: `📊 تقرير أسبوعي — أكاديمية أمين`,
        html,
      })
      sent++
    } catch (err) {
      console.error(`[weekly-report] failed for ${parent.id}:`, err)
      errors++
    }
  }

  return NextResponse.json({ ok: true, sent, errors })
}
