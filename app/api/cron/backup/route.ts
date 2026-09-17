import { NextResponse } from 'next/server'
import { safeCompare } from '@/lib/password'
import { redis } from '@/lib/redis'
import { backupKeyConfigured, buildFullBackup, encryptBackup } from '@/lib/backup'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/** How many archives to keep. Older ones are deleted from Blob and the index. */
const KEEP = 14
const INDEX_KEY = 'backups:index'

/**
 * The nightly off-site backup.
 *
 * Redis is this platform's only store. Every record we made permanent is
 * permanent only for as long as that one Upstash database exists — so the
 * archive has to land somewhere else. It goes to Vercel Blob, encrypted,
 * because Blob serves everything from a public URL and an unguessable URL is
 * not a control you put children's clinical records behind.
 *
 * Fails CLOSED. With no encryption key there is no upload: a readable archive
 * of this data sitting on a public URL is worse than no archive at all. The
 * response says which piece is missing rather than reporting a quiet success —
 * the failure mode this whole audit kept finding.
 */
export async function POST(req: Request) { return run(req) }
export async function GET(req: Request) { return run(req) }

async function run(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  const provided = req.headers.get('authorization') ?? ''
  if (!safeCompare(provided, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY
  if (!backupKeyConfigured() || !encryptionKey) {
    return NextResponse.json({
      ok: false,
      skipped: 'BACKUP_ENCRYPTION_KEY غير مضبوط — لن تُرفع نسخة غير مشفّرة إلى رابط عام',
    }, { status: 503 })
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({
      ok: false,
      skipped: 'BLOB_READ_WRITE_TOKEN غير مضبوط — لم يُربط تخزين Vercel Blob بالمشروع بعد',
    }, { status: 503 })
  }

  try {
    const backup = await buildFullBackup()
    const envelope = encryptBackup(JSON.stringify(backup), encryptionKey)

    const { put, del } = await import('@vercel/blob')
    const stamp = backup.exportedAt.replace(/[:.]/g, '-')
    const blob = await put(`backups/amine-academy-${stamp}.json.enc`, envelope, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json',
    })

    // Keep an index in Redis so the archives can be found again. It is only a
    // pointer list — losing it loses nothing that Blob does not still hold.
    const entry = JSON.stringify({
      url: blob.url,
      exportedAt: backup.exportedAt,
      counts: backup.counts,
      bytes: envelope.length,
    })
    await redis.lpush(INDEX_KEY, entry)

    // Prune beyond KEEP, deleting the object as well as the pointer.
    let pruned = 0
    try {
      const all = await redis.lrange(INDEX_KEY, 0, -1)
      for (const raw of all.slice(KEEP)) {
        try {
          const old = JSON.parse(raw) as { url?: string }
          if (old.url) await del(old.url)
          await redis.pipeline([['LREM', INDEX_KEY, '1', raw]])
          pruned++
        } catch { /* a pointer we cannot parse is dropped on the next pass */ }
      }
    } catch (e) {
      console.warn('[cron/backup] prune skipped:', (e as Error).message)
    }

    return NextResponse.json({
      ok: true,
      url: blob.url,
      bytes: envelope.length,
      counts: backup.counts,
      // Surfaced, not swallowed: a section that failed to read means the
      // archive is short, and that must be visible on the day it is restored.
      sectionErrors: backup.errors,
      pruned,
    })
  } catch (e) {
    console.error('[cron/backup]', e)
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
