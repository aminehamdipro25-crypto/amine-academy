import { NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { getAllParents, getStudentsByParent } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One-off repair: drop the expiry from clinical records that already carry one.
 *
 * Assessments, APA session records and learning-difficulty profiles were each
 * written with `EX 31536000` — a one-year expiry — while the index lists that
 * point at them have none. A child followed for longer than a year would lose
 * their earliest records silently: the ids stay in the list, the records behind
 * them return null, and the history simply appears shorter than it was. The
 * toolkit meanwhile tells the specialist the assessment is saved «بشكل دائم».
 *
 * New writes no longer set an expiry, but that does nothing for what is already
 * stored — Redis keeps the TTL that was set at write time. This walks the
 * indexes and PERSISTs each key.
 *
 * Owner-only, and safe to run repeatedly: PERSIST on a key with no expiry is a
 * no-op that returns 0, which is why the response separates "cleared" from
 * "already permanent" rather than reporting a single total.
 */
export async function POST() {
  if (!(await isOwnerUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const report = {
    assessments: { cleared: 0, alreadyPermanent: 0 },
    apaRecords:  { cleared: 0, alreadyPermanent: 0 },
    ldProfiles:  { cleared: 0, alreadyPermanent: 0 },
    studentsScanned: 0,
    errors: [] as string[],
  }

  /** PERSIST in batches; `result === 1` means an expiry was actually removed. */
  async function persistAll(keys: string[], bucket: { cleared: number; alreadyPermanent: number }) {
    for (let i = 0; i < keys.length; i += 25) {
      const batch = keys.slice(i, i + 25)
      try {
        const out = await redis.pipeline(batch.map(k => ['PERSIST', k]))
        for (const entry of out) {
          if (Number(entry?.result) === 1) bucket.cleared++
          else bucket.alreadyPermanent++
        }
      } catch (e) {
        report.errors.push(`persist batch failed: ${(e as Error).message}`)
      }
    }
  }

  try {
    const parents = await getAllParents()
    for (const parent of parents) {
      let students: Awaited<ReturnType<typeof getStudentsByParent>>
      try {
        students = await getStudentsByParent(parent.id)
      } catch (e) {
        report.errors.push(`students of ${parent.id}: ${(e as Error).message}`)
        continue
      }

      for (const student of students) {
        report.studentsScanned++
        try {
          // The whole list, not the 20 the UI reads — the oldest records are
          // exactly the ones closest to expiring.
          const assessmentIds = await redis.lrange(`assessments:student:${student.id}`, 0, -1)
          await persistAll(assessmentIds.map(id => `assessment:${id}`), report.assessments)

          const apaIds = await redis.lrange(`apa-records:student:${student.id}`, 0, -1)
          await persistAll(apaIds.map(id => `apa-record:${id}`), report.apaRecords)

          await persistAll([`ld-profile:${student.id}`], report.ldProfiles)
        } catch (e) {
          report.errors.push(`student ${student.id}: ${(e as Error).message}`)
        }
      }
    }

    return NextResponse.json({ ok: true, ...report })
  } catch (e) {
    console.error('[maintenance/persist-clinical]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم', ...report }, { status: 500 })
  }
}
