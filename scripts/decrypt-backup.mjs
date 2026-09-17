#!/usr/bin/env node
// Open an encrypted backup produced by /api/cron/backup.
//
// This exists because an archive nobody can read is not a backup. The nightly
// job encrypts before uploading — Vercel Blob serves every object from a public
// URL, and children's clinical records do not belong behind an unguessable URL
// — so restoring needs the same key and this script.
//
//   node scripts/decrypt-backup.mjs <file-or-url> [--out restored.json]
//
// The key comes from BACKUP_ENCRYPTION_KEY, exactly as the server sets it:
//
//   BACKUP_ENCRYPTION_KEY='…' node scripts/decrypt-backup.mjs backup.json.enc
//
// Keep that key somewhere other than Vercel. If the only copy is in the same
// account as the data, the backup protects you from nothing.

import crypto from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const BACKUP_FORMAT = 'amine-backup-v1'

function die(message) {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

function decrypt(envelopeText, secret) {
  let parsed
  try {
    parsed = JSON.parse(envelopeText)
  } catch {
    die('This file is not a backup envelope (it is not JSON).')
  }
  if (parsed.format !== BACKUP_FORMAT) {
    die(`Unknown backup format: ${parsed.format ?? '(none)'}. Expected ${BACKUP_FORMAT}.`)
  }
  if (!parsed.iv || !parsed.tag || !parsed.data) die('The backup envelope is incomplete.')

  const key = crypto.createHash('sha256').update(secret, 'utf8').digest()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parsed.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'))
  try {
    return Buffer.concat([
      decipher.update(Buffer.from(parsed.data, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    die('Could not open the archive. Either the key is wrong, or the file has been altered since it was written.')
  }
}

const args = process.argv.slice(2)
const source = args.find(a => !a.startsWith('--'))
const outIndex = args.indexOf('--out')
const outPath = outIndex !== -1 ? args[outIndex + 1] : null

if (!source) {
  console.log(`
Usage:  node scripts/decrypt-backup.mjs <file-or-url> [--out restored.json]

  BACKUP_ENCRYPTION_KEY must be set to the same value the server uses.
`)
  process.exit(0)
}

const secret = process.env.BACKUP_ENCRYPTION_KEY
if (!secret) die('BACKUP_ENCRYPTION_KEY is not set. It is the only way to open this archive.')

const envelope = source.startsWith('http')
  ? await fetch(source).then(r => {
      if (!r.ok) die(`Could not download the archive: HTTP ${r.status}`)
      return r.text()
    })
  : readFileSync(source, 'utf8')

const plaintext = decrypt(envelope, secret)
const backup = JSON.parse(plaintext)

console.log(`\n✓ Opened backup taken ${backup.exportedAt}\n`)
const rows = Object.entries(backup.counts ?? {})
const width = Math.max(...rows.map(([k]) => k.length))
for (const [type, n] of rows) {
  const mark = n === 0 ? '  (empty)' : ''
  console.log(`  ${type.padEnd(width)}  ${String(n).padStart(6)}${mark}`)
}
if (backup.errors?.length) {
  console.log('\n⚠ Sections that failed to read when this was taken — the archive is short here:')
  for (const e of backup.errors) console.log(`   • ${e}`)
}

if (outPath) {
  writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf8')
  console.log(`\nWritten to ${outPath}\n`)
} else {
  console.log('\nPass --out <file> to write the decrypted JSON.\n')
}
