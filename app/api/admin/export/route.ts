import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { getClientIp } from '@/lib/rateLimit'
import { buildFullBackup } from '@/lib/backup'

export const runtime = 'nodejs'

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return verifyAdminSession(token)
}

// Full data dump, downloaded straight to the owner's machine over an
// authenticated HTTPS request — so this copy is not encrypted. The nightly
// archive that goes to Blob is, because Blob serves from a public URL.
export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  await audit({ action: 'data_export', actorId: 'owner', actorRole: 'owner', ip: getClientIp(req) })
  try {
    // The same builder the nightly job uses, so the manual download can never
    // drift from it again. The old version of this route omitted every
    // assessment, every APA session and every message while calling its file
    // "amine-academy-backup".
    const dump = await buildFullBackup()

    return new NextResponse(JSON.stringify(dump, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="amine-academy-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (e) {
    console.error('[admin/export GET]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
