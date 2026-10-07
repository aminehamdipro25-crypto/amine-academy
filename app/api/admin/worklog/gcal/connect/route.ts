import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { challengeFor, createState, createVerifier } from '@/lib/google-oauth'
import { buildCalendarAuthUrl, gcalRedirectUri } from '@/lib/worklog-gcal'
import { gcalClientConfigured } from '@/lib/worklog-gcal-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GCAL_STATE_COOKIE = 'gcal_state'
const GCAL_VERIFIER_COOKIE = 'gcal_verifier'

/** Leg one: the owner, and only the owner, is sent to Google's consent screen for the calendar. */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin
  if (!(await isOwnerUser())) return NextResponse.redirect(`${origin}/dashboard/login`, 302)
  if (!gcalClientConfigured()) return NextResponse.redirect(`${origin}/dashboard/work-log?gcal=not-configured`, 302)
  const state = createState()
  const verifier = createVerifier()
  const res = NextResponse.redirect(buildCalendarAuthUrl({
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    redirectUri: gcalRedirectUri(origin),
    state,
    challenge: challengeFor(verifier),
  }), 302)
  const opts = { httpOnly: true, secure: origin.startsWith('https:'), sameSite: 'lax' as const, path: '/api/admin/worklog/gcal', maxAge: 600 }
  res.cookies.set(GCAL_STATE_COOKIE, state, opts)
  res.cookies.set(GCAL_VERIFIER_COOKIE, verifier, opts)
  return res
}
