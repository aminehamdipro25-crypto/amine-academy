import 'server-only'
import { redis } from './redis'
import {
  getAllAppointments,
  getAllExercises,
  getAllMessageThreads,
  getAllParents,
  getAllPendingPayments,
  getAllStaff,
  getAllStories,
  getAssessmentProfile,
  getStudentApaRecords,
  getStudentAssessments,
  getStudentGameResults,
  getStudentProgram,
  getStudentReports,
  getStudentsByParent,
  getThreadMessages,
} from './db'

// A backup of everything, and a way to read it back.
//
// The previous export called its download «amine-academy-backup-<date>.json»
// and did not contain the assessments — not the Vanderbilt or PSC-17 results,
// not the APA sessions, not a single message. It carried `assessmentProfiles`,
// which is a different record: the child's exercise preferences, not what any
// scale measured. So the one file the specialist would reach for on the day
// everything else was gone held none of the clinical work.
//
// Two rules follow from that, and both are enforced by tests:
//
//   1. Every record type the app writes appears here. A new one that is added
//      to the key scheme without being added to this file fails the build.
//   2. The backup can be READ BACK. An archive nobody can open is not a
//      backup — scripts/decrypt-backup.mjs opens it with the same key.

import { BACKUP_RECORD_TYPES, type BackupRecordType } from './backup-types'
export { BACKUP_RECORD_TYPES }
export type { BackupRecordType }

export interface FullBackup {
  exportedAt: string
  /** Rows per record type, so an empty section is visible rather than assumed. */
  counts: Record<BackupRecordType, number>
  data: Record<BackupRecordType, unknown[]>
  /** Anything that could not be read, rather than a silently short backup. */
  errors: string[]
}

/** Never put credentials in an archive that leaves the server. */
function stripSecrets<T extends { passwordHash?: string }>(rows: T[]): Omit<T, 'passwordHash'>[] {
  return rows.map(({ passwordHash: _ph, ...rest }) => rest)
}

export async function buildFullBackup(): Promise<FullBackup> {
  const errors: string[] = []
  const data = Object.fromEntries(
    BACKUP_RECORD_TYPES.map(t => [t, [] as unknown[]]),
  ) as Record<BackupRecordType, unknown[]>

  /** One section must not take the whole backup down with it. */
  async function section<T>(type: BackupRecordType, load: () => Promise<T[]>) {
    try {
      data[type] = await load()
    } catch (e) {
      errors.push(`${type}: ${(e as Error).message}`)
    }
  }

  const parents = await getAllParents()
  const students = (await Promise.all(parents.map(p => getStudentsByParent(p.id)))).flat()

  data.parents = stripSecrets(parents)
  data.students = students

  await section('staff', async () => stripSecrets(await getAllStaff()))
  await section('exercises', getAllExercises)
  await section('stories', getAllStories)
  await section('appointments', getAllAppointments)
  await section('payments', getAllPendingPayments)

  // Per-child records.
  await section('reports', async () =>
    (await Promise.all(students.map(s => getStudentReports(s.id)))).flat())
  await section('assessments', async () =>
    (await Promise.all(students.map(s => getStudentAssessments(s.id)))).flat())
  await section('assessmentProfiles', async () =>
    (await Promise.all(students.map(s => getAssessmentProfile(s.id)))).filter(Boolean))
  await section('apaRecords', async () =>
    (await Promise.all(students.map(s => getStudentApaRecords(s.id)))).flat())
  await section('gameResults', async () =>
    (await Promise.all(students.map(s => getStudentGameResults(s.id)))).flat())
  await section('programs', async () =>
    (await Promise.all(students.map(s => getStudentProgram(s.id)))).filter(Boolean))

  // Records reached only by a direct key elsewhere in the app.
  await section('learningDifficultyProfiles', async () =>
    (await Promise.all(students.map(s => redis.get(`ld-profile:${s.id}`)))).filter(Boolean))
  await section('treatmentPlans', async () =>
    (await Promise.all(students.map(async s => {
      const plan = await redis.get(`treatment-plan:${s.id}`)
      return plan ? { studentId: s.id, plan } : null
    }))).filter(Boolean))
  await section('homework', async () =>
    (await Promise.all(students.map(async s => {
      const hw = await redis.get(`homework:${s.id}`)
      return hw ? { studentId: s.id, homework: hw } : null
    }))).filter(Boolean))

  // The correspondence, thread by thread.
  await section('messages', async () => {
    const threads = await getAllMessageThreads()
    return (await Promise.all(threads.map(async t => ({
      parentId: t.parentId,
      messages: await getThreadMessages(t.parentId),
    })))).filter(t => t.messages.length > 0)
  })

  const counts = Object.fromEntries(
    BACKUP_RECORD_TYPES.map(t => [t, data[t].length]),
  ) as Record<BackupRecordType, number>

  return { exportedAt: new Date().toISOString(), counts, data, errors }
}

export {
  BACKUP_FORMAT,
  backupKeyConfigured,
  decryptBackup,
  encryptBackup,
} from './backup-crypto'
