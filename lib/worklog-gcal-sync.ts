// Network side of the Google Calendar copy: holds the owner's refresh token,
// trades it for short access tokens, and writes one event per lesson.
//
// The work log stays the source of truth, exactly as with Notion. A Google
// failure never fails a lesson save: it is recorded (GCAL_LAST_KEY), shown in
// Settings, and «نسخ كل الحصص» repairs whatever was missed.

import { redis } from './redis'
import { getWork, getWorkSettings, listWork } from './worklog-store'
import { lessonGcalEvent } from './worklog-gcal'
import type { WorkClient, WorkLesson } from './worklog'

const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

/**
 * The refresh token. A secret: it never reaches the browser and is NOT in the
 * backup — a leaked backup must not be a key to the owner's calendar. After a
 * restore the owner presses «ربط» once more.
 */
const AUTH_KEY = 'worklog:gcal:auth'
const ACCESS_KEY = 'worklog:gcal:access'
/** lesson id → Google event id. No expiry: losing it would duplicate events. */
const eventKey = (lessonId: string) => `worklog:gcal:event:${lessonId}`
export const GCAL_EVENTS_INDEX = 'worklog:gcal:events'
export const GCAL_LAST_KEY = 'worklog:gcal:last'

interface GcalAuth { refreshToken: string; email?: string; connectedAt: string }
export interface GcalLast { at: string; ok: boolean; error?: string; lessonId?: string }

export function gcalClientConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export class GcalError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

export async function gcalConnection(): Promise<{ connected: boolean; email?: string; connectedAt?: string }> {
  const auth = await redis.get<GcalAuth>(AUTH_KEY).catch(() => null)
  return auth?.refreshToken ? { connected: true, email: auth.email, connectedAt: auth.connectedAt } : { connected: false }
}

export async function saveGcalAuth(auth: GcalAuth): Promise<void> {
  await redis.set(AUTH_KEY, auth)
  await redis.del(ACCESS_KEY)
}

/** Forget the token. The events already written stay in the calendar. */
export async function forgetGcalAuth(): Promise<void> {
  const auth = await redis.get<GcalAuth>(AUTH_KEY).catch(() => null)
  await redis.pipeline([['DEL', AUTH_KEY], ['DEL', ACCESS_KEY]])
  // Revoke at Google too, so the grant does not linger in the owner's account.
  if (auth?.refreshToken) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(auth.refreshToken)}`, { method: 'POST' }).catch(() => {})
  }
}

async function accessToken(force = false): Promise<string> {
  if (!force) {
    const cached = await redis.get<string>(ACCESS_KEY).catch(() => null)
    if (cached) return cached
  }
  const auth = await redis.get<GcalAuth>(AUTH_KEY)
  if (!auth?.refreshToken) throw new GcalError('تقويم Google غير مربوط', 412)
  let res: Response
  try {
    res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: auth.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new GcalError('تعذّر الوصول إلى Google — أعد المحاولة بعد قليل', 503)
  }
  const body = await res.json().catch(() => ({})) as { access_token?: string; expires_in?: number; error?: string }
  if (!res.ok || !body.access_token) {
    // invalid_grant: the owner removed access, or the consent screen is still
    // in «Testing» (Google then expires the grant after 7 days).
    throw new GcalError(body.error === 'invalid_grant'
      ? 'انتهى إذن Google أو أُلغي — اضغط «إعادة الربط». إن تكرّر كل أسبوع فشاشة الموافقة في Google Cloud ما زالت في وضع Testing.'
      : `رفض Google تجديد الإذن (${res.status})`, 401)
  }
  await redis.set(ACCESS_KEY, body.access_token, { ex: Math.max(60, (body.expires_in ?? 3600) - 120) })
  return body.access_token
}

async function gcal<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await accessToken(attempt > 0)
    let res: Response
    try {
      res = await fetch(`${API}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      })
    } catch {
      throw new GcalError('تعذّر الوصول إلى Google — أعد المحاولة بعد قليل', 503)
    }
    if (res.status === 401 && attempt === 0) continue // a stale cached token: refresh once
    if (res.status === 204) return null
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: { message?: string } }
      const msg = body.error?.message ?? ''
      const why = res.status === 403 && /not been used|disabled/i.test(msg)
        ? 'واجهة Google Calendar API غير مُفعّلة في مشروع Google Cloud — فعّلها من «APIs & Services ← Library».'
        : res.status === 403 && /insufficient/i.test(msg) ? 'الإذن لا يشمل التقويم — اضغط «إعادة الربط» ووافق على التقويم.'
          : res.status === 429 || /rate limit/i.test(msg) ? 'Google طلب التمهّل — أعد المحاولة بعد قليل'
            : `خطأ من Google (${res.status})${msg ? `: ${msg}` : ''}`
      throw new GcalError(why, res.status)
    }
    return res.json() as Promise<T>
  }
  throw new GcalError('رفض Google الإذن — اضغط «إعادة الربط»', 401)
}

async function record(last: GcalLast) {
  try { await redis.set(GCAL_LAST_KEY, last) } catch { /* the status line is best-effort */ }
}

async function upsertOne(l: WorkLesson, c: WorkClient | undefined, timezone: string): Promise<void> {
  const body = JSON.stringify(lessonGcalEvent(l, c, { timezone }))
  const existing = await redis.get<string>(eventKey(l.id))
  if (existing) {
    try {
      await gcal(`/${encodeURIComponent(existing)}`, { method: 'PUT', body })
      return
    } catch (e) {
      // Deleted by hand in the calendar (404, or 410 once purged): write it again.
      if (!(e instanceof GcalError && (e.status === 404 || e.status === 410))) throw e
    }
  }
  const ev = await gcal<{ id: string }>('', { method: 'POST', body })
  if (!ev?.id) throw new GcalError('لم يُرجع Google معرّف الحدث', 502)
  await redis.set(eventKey(l.id), ev.id)
  await redis.sadd(GCAL_EVENTS_INDEX, l.id)
}

/** Writes these lessons to the calendar. Never throws: the outcome goes to GCAL_LAST_KEY. */
export async function syncLessonsToGcal(lessons: WorkLesson[]): Promise<{ synced: number; error?: string }> {
  if (!lessons.length || !gcalClientConfigured() || !(await gcalConnection()).connected) return { synced: 0 }
  const settings = await getWorkSettings()
  let synced = 0
  try {
    const clients = new Map<string, WorkClient | undefined>()
    for (const l of lessons) {
      if (!clients.has(l.clientId)) clients.set(l.clientId, (await getWork('clients', l.clientId)) ?? undefined)
      await upsertOne(l, clients.get(l.clientId), settings.timezone)
      synced++
    }
    await record({ at: new Date().toISOString(), ok: true })
    return { synced }
  } catch (e) {
    const error = (e as Error).message
    console.warn('[worklog gcal] sync failed:', error)
    await record({ at: new Date().toISOString(), ok: false, error, lessonId: lessons[synced]?.id })
    return { synced, error }
  }
}

/** A deleted lesson's event is removed from the calendar. */
export async function deleteLessonsFromGcal(lessonIds: string[]): Promise<void> {
  if (!lessonIds.length || !gcalClientConfigured() || !(await gcalConnection()).connected) return
  for (const id of lessonIds) {
    const ev = await redis.get<string>(eventKey(id))
    if (!ev) continue
    try {
      await gcal(`/${encodeURIComponent(ev)}`, { method: 'DELETE' })
    } catch (e) {
      if (!(e instanceof GcalError && (e.status === 404 || e.status === 410))) {
        await record({ at: new Date().toISOString(), ok: false, error: (e as Error).message, lessonId: id })
        continue
      }
    }
    await redis.pipeline([['DEL', eventKey(id)], ['SREM', GCAL_EVENTS_INDEX, id]])
  }
}

/** lesson → Google event links, for the backup: without them a re-sync duplicates every event. */
export async function listGcalEventLinks(): Promise<{ lessonId: string; eventId: string }[]> {
  const ids = await redis.smembers(GCAL_EVENTS_INDEX)
  const out: { lessonId: string; eventId: string }[] = []
  for (const id of ids) {
    const eventId = await redis.get<string>(eventKey(id))
    if (eventId) out.push({ lessonId: id, eventId })
  }
  return out
}

/** A family's lessons again, after its name, address or phone changed (the events carry them). */
export async function resyncFamilyInGcal(clientId: string): Promise<void> {
  const lessons = (await listWork('lessons')).filter(l => l.clientId === clientId)
  await syncLessonsToGcal(lessons)
}

/** The authorisation code → the refresh token (and the address it belongs to). */
export async function exchangeCalendarCode(o: { code: string; redirectUri: string; verifier: string }): Promise<{ refreshToken: string; idToken?: string }> {
  let res: Response
  try {
    res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: o.code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: o.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: o.verifier,
      }).toString(),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new GcalError('تعذّر الوصول إلى Google', 503)
  }
  const body = await res.json().catch(() => ({})) as { refresh_token?: string; id_token?: string; scope?: string; error?: string }
  if (!res.ok) throw new GcalError(`رفض Google الرمز (${res.status}${body.error ? `: ${body.error}` : ''})`, res.status)
  if (!body.refresh_token) throw new GcalError('لم يُعطِ Google إذناً دائماً — أزل التطبيق من حسابك في Google ثم أعد الربط', 400)
  if (body.scope && !body.scope.includes('calendar.events')) throw new GcalError('لم تتم الموافقة على التقويم — أعد الربط وفعّل خانة التقويم', 400)
  return { refreshToken: body.refresh_token, idToken: body.id_token }
}
