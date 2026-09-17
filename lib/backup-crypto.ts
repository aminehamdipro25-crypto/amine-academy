import crypto from 'crypto'

// Encrypting a backup archive.
//
// Vercel Blob serves every object from a public URL. The URL is unguessable,
// but "unguessable" is not a control you put a children's clinical archive
// behind — so what goes up is ciphertext, and the key never leaves the
// environment. AES-256-GCM, which also authenticates: a tampered archive fails
// to open rather than decoding into something plausible.

export const BACKUP_FORMAT = 'amine-backup-v1'

/** 32-byte key derived from the configured passphrase. */
function keyFrom(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret, 'utf8').digest()
}

export function backupKeyConfigured(): boolean {
  return Boolean(process.env.BACKUP_ENCRYPTION_KEY)
}

export function encryptBackup(plaintext: string, secret: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFrom(secret), iv)
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return JSON.stringify({
    format: BACKUP_FORMAT,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: body.toString('base64'),
  })
}

export function decryptBackup(envelope: string, secret: string): string {
  const parsed = JSON.parse(envelope) as { format?: string; iv?: string; tag?: string; data?: string }
  if (parsed.format !== BACKUP_FORMAT) throw new Error(`Unknown backup format: ${parsed.format}`)
  if (!parsed.iv || !parsed.tag || !parsed.data) throw new Error('Backup envelope is incomplete')

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    keyFrom(secret),
    Buffer.from(parsed.iv, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(parsed.data, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
