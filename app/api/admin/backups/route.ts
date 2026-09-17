import { NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { backupKeyConfigured } from '@/lib/backup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The archives the nightly job has taken, newest first.
 *
 * Without this there is no way to find them: the URLs are random and the only
 * record of them is a Redis list. It also reports whether the job can run at
 * all — a backup that has been silently skipped for months because an
 * environment variable was never set is the failure this whole audit kept
 * turning up, and it should be visible before it matters.
 */
export async function GET() {
  if (!(await isOwnerUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const configured = {
    encryptionKey: backupKeyConfigured(),
    blobStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    cronSecret: Boolean(process.env.CRON_SECRET),
  }
  const ready = configured.encryptionKey && configured.blobStorage && configured.cronSecret

  let backups: unknown[] = []
  try {
    const raw = await redis.lrange('backups:index', 0, -1)
    backups = raw.map(r => { try { return JSON.parse(r) } catch { return null } }).filter(Boolean)
  } catch (e) {
    return NextResponse.json({ ready, configured, backups: [], error: (e as Error).message })
  }

  const newest = backups[0] as { exportedAt?: string } | undefined
  const ageHours = newest?.exportedAt
    ? Math.round((Date.now() - new Date(newest.exportedAt).getTime()) / 3_600_000)
    : null

  return NextResponse.json({
    ready,
    configured,
    // Loud rather than merely absent: "no backup has ever run" and "the last one
    // is four days old" are both worth noticing.
    warning: !ready
      ? 'النسخ الاحتياطي التلقائي غير مُفعّل — راجع المتغيّرات أعلاه'
      : backups.length === 0
        ? 'لم تُؤخذ أي نسخة بعد'
        : ageHours !== null && ageHours > 48
          ? `آخر نسخة عمرها ${ageHours} ساعة — يُفترض أن تُؤخذ يومياً`
          : null,
    lastBackupAgeHours: ageHours,
    count: backups.length,
    backups,
  })
}
