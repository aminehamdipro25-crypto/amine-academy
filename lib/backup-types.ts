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
] as const

export type BackupRecordType = (typeof BACKUP_RECORD_TYPES)[number]
