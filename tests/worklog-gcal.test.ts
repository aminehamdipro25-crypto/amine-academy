import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { WorkClient, WorkLesson } from '@/lib/worklog'
import { CLIENT_COLORS } from '@/lib/worklog'
import { FAMILY_GCAL_COLOR, GCAL_SCOPE, buildCalendarAuthUrl, gcalRedirectUri, lessonGcalEvent } from '@/lib/worklog-gcal'

const lesson = (over: Partial<WorkLesson> = {}): WorkLesson => ({
  id: 'l1', clientId: 'k', date: '2026-10-10', start: '11:30', durationMin: 60, price: 120,
  status: 'scheduled', reminderMin: 60, createdAt: '', updatedAt: '', ...over,
})
const client = { id: 'k', name: 'أبو خالد', childName: 'خالد', phone: '+97455555555', address: 'الوكرة', location: { lat: 25.17, lng: 51.6 } } as unknown as WorkClient
const tz = { timezone: 'Asia/Qatar' }

describe('a lesson becomes a Google Calendar event', () => {
  it('wall-clock time in the ledger\'s zone — no UTC arithmetic to get wrong', () => {
    const e = lessonGcalEvent(lesson(), client, tz)
    expect(e.start).toEqual({ dateTime: '2026-10-10T11:30:00', timeZone: 'Asia/Qatar' })
    expect(e.end).toEqual({ dateTime: '2026-10-10T12:30:00', timeZone: 'Asia/Qatar' })
    expect(e.summary).toBe('حصة: خالد — أبو خالد')
    expect(e.location).toBe('الوكرة')
    expect(e.description).toContain('الهاتف: +97455555555')
    expect(e.description).toContain('google.com/maps')
    expect(e.extendedProperties.private.worklogLessonId).toBe('l1')
  })

  it('a lesson ahead rings at its own reminder; done, cancelled and «no reminder» stay silent', () => {
    expect(lessonGcalEvent(lesson(), client, tz).reminders).toEqual({ useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] })
    for (const over of [{ status: 'done' as const }, { status: 'cancelled' as const }, { reminderMin: null }]) {
      // useDefault false: the calendar's own default reminder must not ring either.
      expect(lessonGcalEvent(lesson(over), client, tz).reminders).toEqual({ useDefault: false, overrides: [] })
    }
  })

  it('a cancelled lesson stays visible, marked, with its reason, and does not block the hour', () => {
    const e = lessonGcalEvent(lesson({ status: 'cancelled', cancelReason: 'ظرف طارئ' }), client, tz)
    expect(e.summary).toBe('✕ ملغاة — حصة: خالد — أبو خالد')
    expect(e.description).toContain('سبب الإلغاء: ظرف طارئ')
    expect(e.transparency).toBe('transparent')
    expect(lessonGcalEvent(lesson({ status: 'done' }), client, tz).summary.startsWith('✓ ')).toBe(true)
  })

  it('each event carries its family\'s colour from the work log, whatever its status', () => {
    const orange = { ...client, color: '#F97316' } as WorkClient
    for (const status of ['scheduled', 'done', 'cancelled'] as const) {
      expect(lessonGcalEvent(lesson({ status }), orange, tz).colorId).toBe('6')
    }
    expect(lessonGcalEvent(lesson(), { ...client, color: '#e11d48' } as WorkClient, tz).colorId).toBe('11')
    expect(lessonGcalEvent(lesson(), undefined, tz).colorId).toBe('9')
  })

  it('every colour a family can be given has a Google colour', () => {
    for (const c of CLIENT_COLORS) expect(FAMILY_GCAL_COLOR[c]).toMatch(/^([1-9]|1[01])$/)
  })

  it('a second child of the family is named on the event', () => {
    expect(lessonGcalEvent(lesson({ child: 'تميم' }), client, tz).summary).toBe('حصة: تميم — أبو خالد')
  })

  it('a lesson running past midnight ends on the next day', () => {
    const e = lessonGcalEvent(lesson({ start: '23:30', durationMin: 60 }), client, tz)
    expect(e.end.dateTime).toBe('2026-10-11T00:30:00')
  })
})

describe('the calendar consent', () => {
  it('asks for events only, with offline access and PKCE', () => {
    const u = new URL(buildCalendarAuthUrl({ clientId: 'cid', redirectUri: gcalRedirectUri('https://x.com/'), state: 's', challenge: 'c' }))
    expect(u.searchParams.get('scope')).toBe(`openid email ${GCAL_SCOPE}`)
    expect(GCAL_SCOPE).toBe('https://www.googleapis.com/auth/calendar.events')
    expect(u.searchParams.get('access_type')).toBe('offline')
    expect(u.searchParams.get('code_challenge_method')).toBe('S256')
    expect(u.searchParams.get('redirect_uri')).toBe('https://x.com/api/admin/worklog/gcal/callback')
  })

  it('both routes are owner-only, and the refresh token never reaches the page or the backup', () => {
    const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')
    for (const r of ['app/api/admin/worklog/gcal/connect/route.ts', 'app/api/admin/worklog/gcal/callback/route.ts']) {
      expect(read(r)).toContain('isOwnerUser()')
    }
    expect(read('app/api/admin/worklog/integrations/route.ts')).not.toMatch(/refreshToken/)
    expect(read('lib/backup.ts')).not.toMatch(/gcalConnection|refreshToken/)
    // The connection status reports the address and date only.
    expect(read('lib/worklog-gcal-sync.ts')).toMatch(/connected: true, email: auth\.email, connectedAt: auth\.connectedAt/)
  })
})
