import { NextResponse } from 'next/server'
import { getAllParents, getStudentsByParent, getStudentGameHistory } from '@/lib/db'
import { sendEmail, weeklyProgressEmail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
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

      const hasActivity = studentProgress.some(sp => sp.history.totalPlays > 0)
      if (!hasActivity) continue

      const html = weeklyProgressEmail(parent.firstName, studentProgress)
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
