// The shape of a full backup, kept free of the database layer so the guard that
// checks every record type is covered can load it without pulling in Redis.

/** Every record type a full backup must carry. The test reads this list. */
export const BACKUP_RECORD_TYPES = [
  'staff', 'parents', 'students', 'exercises', 'stories', 'programs',
  'appointments', 'reports', 'assessments', 'assessmentProfiles',
  'apaRecords', 'messages', 'gameResults', 'payments',
  'learningDifficultyProfiles', 'treatmentPlans', 'homework',
  // The private-lesson ledger (lib/worklog-store.ts): money owed and paid has
  // no other copy anywhere.
  'worklogClients', 'worklogLessons', 'worklogPayments', 'worklogExpenses',
  // Which Notion row holds which lesson: lose it and a re-sync duplicates every row.
  'worklogNotionPages',
  // Which Google Calendar event holds which lesson — the same reason. The
  // calendar's refresh token is deliberately NOT here: a backup is not a key.
  'worklogGcalEvents',
] as const

export type BackupRecordType = (typeof BACKUP_RECORD_TYPES)[number]
