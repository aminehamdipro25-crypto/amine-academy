import crypto from 'crypto'

/** How long a one-time owner-recovery link stays valid. */
export const RECOVERY_TTL_SECONDS = 15 * 60

/**
 * Redis key for a recovery token. The token is stored HASHED, never raw, so a
 * leaked Redis dump can't be replayed into a dashboard session.
 */
export function recoveryKey(token: string): string {
  return `admin_recovery:${crypto.createHash('sha256').update(token).digest('hex')}`
}

/**
 * The one address a recovery link may ever be sent to. Read from server env
 * only — deliberately NOT from the request — so nobody can redirect the link
 * to an address they control.
 */
export function recoveryRecipient(): string | undefined {
  return process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.GMAIL_USER
}

/** Absolute origin for building the emailed link. */
export function recoveryBaseUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return new URL(req.url).origin
}
