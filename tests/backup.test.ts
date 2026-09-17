// The export called its download «amine-academy-backup-<date>.json» and did not
// contain a single assessment, APA session or message. It carried
// `assessmentProfiles`, which is a different record — the child's exercise
// preferences, not what any scale measured.
//
// Two things are guarded here, because they are the two ways a backup betrays
// you: it turns out to be missing something, or it turns out not to open.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
// The crypto lives in its own module precisely so it is testable: lib/backup.ts
// pulls in the database layer and `server-only`.
import { BACKUP_FORMAT, decryptBackup, encryptBackup } from '../lib/backup-crypto'
import { BACKUP_RECORD_TYPES } from '../lib/backup-types'

const ROOT = path.resolve(__dirname, '..')

describe('the backup covers every record the app writes', () => {
  // Read the key scheme rather than a list someone remembered to update: a new
  // record type added to db.ts without a place in the backup fails here.
  const dbSource = fs.readFileSync(path.join(ROOT, 'lib/db.ts'), 'utf8')

  /** Key prefix in db.ts → the backup section that must carry it. */
  const KEY_TO_SECTION: Record<string, string> = {
    'parent:':            'parents',
    'student:':           'students',
    'exercise:':          'exercises',
    'story:':             'stories',
    'program:':           'programs',
    'appointment:':       'appointments',
    'report:':            'reports',
    'assessment:':        'assessments',
    'assessment-profile:': 'assessmentProfiles',
    'apa-record:':        'apaRecords',
    'message:':           'messages',
    'game-result:':       'gameResults',
    'payment:':           'payments',
    'staff:':             'staff',
  }

  it('every durable key in the scheme maps to a section that exists', () => {
    const missing: string[] = []
    for (const [key, section] of Object.entries(KEY_TO_SECTION)) {
      // The key really is written by db.ts — keeps this table honest too.
      const written = dbSource.includes(`\`${key}$`)
      if (!written) { missing.push(`${key} is no longer written by db.ts — update this table`); continue }
      if (!(BACKUP_RECORD_TYPES as readonly string[]).includes(section)) {
        missing.push(`${key} has no backup section (${section})`)
      }
    }
    expect(missing, missing.join('\n')).toEqual([])
  })

  it('carries the clinical records the old export silently dropped', () => {
    for (const section of ['assessments', 'apaRecords', 'messages', 'programs', 'treatmentPlans']) {
      expect(BACKUP_RECORD_TYPES as readonly string[], section).toContain(section)
    }
  })

  it('keeps assessments and assessmentProfiles as separate sections', () => {
    // Conflating them is exactly what made the gap invisible.
    expect(BACKUP_RECORD_TYPES).toContain('assessments')
    expect(BACKUP_RECORD_TYPES).toContain('assessmentProfiles')
  })

  it('names no section twice', () => {
    expect(new Set(BACKUP_RECORD_TYPES).size).toBe(BACKUP_RECORD_TYPES.length)
  })
})

describe('the archive can be opened again', () => {
  const KEY = 'a-test-passphrase'
  const payload = JSON.stringify({
    exportedAt: '2026-09-17T02:00:00.000Z',
    counts: { assessments: 3 },
    data: { assessments: [{ id: 'AR-1', studentId: 's1', severity: 'moderate' }] },
  })

  it('round-trips exactly', () => {
    expect(decryptBackup(encryptBackup(payload, KEY), KEY)).toBe(payload)
  })

  it('round-trips Arabic without mangling it', () => {
    const arabic = JSON.stringify({ name: 'هجرس علي', note: 'تشتّت بعد الدقيقة الرابعة' })
    expect(decryptBackup(encryptBackup(arabic, KEY), KEY)).toBe(arabic)
  })

  it('produces different ciphertext each time, from the same input', () => {
    // A fresh IV per archive; identical output would leak that nothing changed.
    expect(encryptBackup(payload, KEY)).not.toBe(encryptBackup(payload, KEY))
  })

  it('never leaves the contents readable in the envelope', () => {
    const envelope = encryptBackup(payload, KEY)
    expect(envelope).not.toContain('هجرس')
    expect(envelope).not.toContain('assessments')
    expect(envelope).not.toContain('AR-1')
  })

  it('carries a format marker, so a future change is detectable', () => {
    expect(JSON.parse(encryptBackup(payload, KEY)).format).toBe(BACKUP_FORMAT)
  })
})

describe('refusing to open something it should not', () => {
  const KEY = 'a-test-passphrase'

  it('rejects the wrong key rather than returning rubbish', () => {
    const envelope = encryptBackup('{"a":1}', KEY)
    expect(() => decryptBackup(envelope, 'not-the-key')).toThrow()
  })

  it('rejects an archive that has been altered', () => {
    const envelope = JSON.parse(encryptBackup('{"a":1}', KEY))
    const flipped = Buffer.from(envelope.data, 'base64')
    flipped[0] ^= 0xff
    envelope.data = flipped.toString('base64')
    // GCM authenticates: a tampered archive fails instead of decoding into
    // something that looks plausible.
    expect(() => decryptBackup(JSON.stringify(envelope), KEY)).toThrow()
  })

  it('rejects an unknown format', () => {
    expect(() => decryptBackup(JSON.stringify({ format: 'something-else' }), KEY)).toThrow(/format/i)
  })

  it('rejects an incomplete envelope', () => {
    expect(() => decryptBackup(JSON.stringify({ format: BACKUP_FORMAT, iv: 'x' }), KEY)).toThrow(/incomplete/i)
  })
})

describe('the restore tool ships with the archive format', () => {
  const script = path.join(ROOT, 'scripts/decrypt-backup.mjs')

  it('exists — an archive nobody can open is not a backup', () => {
    expect(fs.existsSync(script)).toBe(true)
  })

  it('reads the same format the server writes', () => {
    expect(fs.readFileSync(script, 'utf8')).toContain(BACKUP_FORMAT)
  })
})
