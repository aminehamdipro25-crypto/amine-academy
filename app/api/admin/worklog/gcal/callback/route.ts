import { NextRequest, NextResponse, after } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { decodeIdTokenPayload } from '@/lib/google-oauth'
import { gcalRedirectUri } from '@/lib/worklog-gcal'
import { exchangeCalendarCode, saveGcalAuth, syncLessonsToGcal } from '@/lib/worklog-gcal-sync'
import { getWorkSettings, listWork } from '@/lib/worklog-store'
import { todayIn } from '@/lib/worklog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Leg two. The state must match this browser's cookie, the code is exchanged
 * with the PKCE verifier, and the owner's session must still be the one that
 * started — a code arriving on anyone else's session is thrown away.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const back = (code: string) => {
    const res = NextResponse.redirect(`${url.origin}/dashboard/work-log?gcal=${code}`, 302)
    for (const c of ['gcal_state', 'gcal_verifier']) res.cookies.set(c, '', { path: '/api/admin/worklog/gcal', maxAge: 0 })
    return res
  }
  if (!(await isOwnerUser())) return NextResponse.redirect(`${url.origin}/dashboard/login`, 302)
  if (url.searchParams.get('error')) return back('cancelled')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const verifier = req.cookies.get('gcal_verifier')?.value
  if (!code || !state || state !== req.cookies.get('gcal_state')?.value || !verifier) return back('bad-state')

  try {
    const { refreshToken, idToken } = await exchangeCalendarCode({ code, redirectUri: gcalRedirectUri(url.origin), verifier })
    const email = idToken ? String(decodeIdTokenPayload(idToken)?.email ?? '') || undefined : undefined
    await saveGcalAuth({ refreshToken, email, connectedAt: new Date().toISOString() })
  } catch (e) {
    console.error('[worklog gcal callback]', (e as Error).message)
    return back('failed')
  }

  // Lessons from today on appear at once; older ones with «نسخ كل الحصص».
  after(async () => {
    const today = todayIn((await getWorkSettings()).timezone)
    const upcoming = (await listWork('lessons')).filter(l => l.date >= today)
    await syncLessonsToGcal(upcoming)
  })
  return back('connected')
}
