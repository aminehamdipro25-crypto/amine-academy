// The work log written straight into the owner's Google Calendar — the pure half
// (event shape, consent URL). The network half is lib/worklog-gcal-sync.ts.
//
// Why this exists beside the Notion copy and the ICS feed: Notion Calendar
// shows a Notion database only after it is added from the desktop app, which
// an Android tablet cannot do; and Google refreshes a subscribed ICS feed every
// few hours and ignores its alarms. An event written through the Calendar API
// appears at once in Google Calendar — and in Notion Calendar, which shows that
// Google account — and its popup reminder actually rings on the phone.

import { endTime, googleDirectionsUrl, lessonWho, type WorkClient, type WorkLesson, type WorkSettings } from './worklog'

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

/** Events only — not the owner's other calendars, contacts or mail. */
export const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

export function gcalRedirectUri(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/api/admin/worklog/gcal/callback`
}

/**
 * Consent for the calendar. Unlike the parents' sign-in, this one needs
 * `offline` access: lessons are written from the server after every save,
 * long after the owner has left the consent screen. `prompt=consent` makes
 * Google hand back a refresh token even on a second connection.
 */
export function buildCalendarAuthUrl(o: { clientId: string; redirectUri: string; state: string; challenge: string }): string {
  const params = new URLSearchParams({
    client_id: o.clientId,
    redirect_uri: o.redirectUri,
    response_type: 'code',
    scope: `openid email ${GCAL_SCOPE}`,
    state: o.state,
    code_challenge: o.challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  })
  return `${AUTH_ENDPOINT}?${params.toString()}`
}

/** «2026-10-10» + 1 day, for a lesson that ends after midnight. */
function nextDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

// Google's event colours: blueberry for a lesson still ahead, basil once it
// happened, graphite when cancelled — the same reading as the agenda's colours.
const COLOR = { scheduled: '9', done: '10', cancelled: '8' } as const

export interface GcalEvent {
  summary: string
  location?: string
  description?: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  colorId: string
  transparency: 'opaque' | 'transparent'
  reminders: { useDefault: false; overrides: { method: 'popup'; minutes: number }[] }
  extendedProperties: { private: { worklogLessonId: string } }
}

/**
 * The event for one lesson. Wall-clock time plus the ledger's time zone, so
 * Google places it correctly whatever zone the phone is in — no UTC maths here.
 *
 * A cancelled lesson stays on the calendar, marked and greyed, rather than
 * disappearing: «was Saif's lesson on Tuesday?» is answered by looking.
 * (Google's own `status: cancelled` would delete it from every view.)
 */
export function lessonGcalEvent(
  l: WorkLesson, c: WorkClient | undefined, settings: Pick<WorkSettings, 'timezone'>,
): GcalEvent {
  const who = lessonWho(l, c, ' — ')
  const end = endTime(l.start, l.durationMin)
  const endDate = end <= l.start && l.durationMin > 0 ? nextDate(l.date) : l.date
  const prefix = l.status === 'cancelled' ? '✕ ملغاة — ' : l.status === 'done' ? '✓ ' : ''
  const description = [
    c?.phone ? `الهاتف: ${c.phone}` : '',
    c?.location ? `الطريق: ${googleDirectionsUrl(c.location)}` : '',
    l.status === 'cancelled' && l.cancelReason ? `سبب الإلغاء: ${l.cancelReason}` : '',
    l.note ? `ملاحظة: ${l.note}` : '',
    'من دفتر الحصص — عدّل الحصة من الدفتر لا من هنا، فالتعديل هنا يُستبدل عند الحفظ التالي.',
  ].filter(Boolean).join('\n')
  const location = c?.address?.trim() || (c?.location ? `${c.location.lat},${c.location.lng}` : '')
  return {
    summary: `${prefix}حصة: ${who}`,
    ...(location ? { location } : {}),
    description,
    start: { dateTime: `${l.date}T${l.start}:00`, timeZone: settings.timezone },
    end: { dateTime: `${endDate}T${end}:00`, timeZone: settings.timezone },
    colorId: COLOR[l.status],
    // A cancelled lesson does not block the hour in «free / busy».
    transparency: l.status === 'cancelled' ? 'transparent' : 'opaque',
    reminders: {
      useDefault: false,
      // Only a lesson still ahead rings; Google allows up to four weeks before.
      overrides: l.status === 'scheduled' && l.reminderMin !== null
        ? [{ method: 'popup', minutes: Math.min(Math.max(0, l.reminderMin), 40320) }]
        : [],
    },
    extendedProperties: { private: { worklogLessonId: l.id } },
  }
}
