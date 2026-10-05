import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { dueReminders, wallClockIn, type WorkLesson } from '@/lib/worklog'
import {
  guessNotionMap, lessonNotionProperties, parseNotionDbId, parseNotionSchema, validNotionMap, type NotionProp,
} from '@/lib/worklog-notion'

const lesson = (over: Partial<WorkLesson> = {}): WorkLesson => ({
  id: 'l1', clientId: 'k', date: '2026-10-05', start: '16:00', durationMin: 60, price: 120,
  status: 'scheduled', reminderMin: 60, createdAt: '', updatedAt: '', ...over,
})

describe('the 1-hour reminder runs on the lesson\'s own clock', () => {
  it('reads the wall clock of the work time zone on a UTC server', () => {
    const w = wallClockIn('Asia/Qatar', new Date('2026-10-05T12:05:00Z'))
    expect([w.getFullYear(), w.getMonth() + 1, w.getDate(), w.getHours(), w.getMinutes()]).toEqual([2026, 10, 5, 15, 5])
    const t = wallClockIn('Africa/Tunis', new Date('2026-10-05T23:30:00Z'))
    expect([t.getDate(), t.getHours(), t.getMinutes()]).toEqual([6, 0, 30])
  })

  it('a 16:00 lesson in Doha is due from 15:00 until it starts — never before, never after', () => {
    const at = (utc: string) => dueReminders([lesson()], wallClockIn('Asia/Qatar', new Date(utc)), new Set()).length
    expect(at('2026-10-05T11:59:00Z')).toBe(0) // 14:59
    expect(at('2026-10-05T12:00:00Z')).toBe(1) // 15:00
    expect(at('2026-10-05T12:55:00Z')).toBe(1) // 15:55 — a late run still sends it
    expect(at('2026-10-05T13:00:00Z')).toBe(0) // 16:00 — the lesson has begun
  })

  it('done, cancelled and «no reminder» lessons are never sent', () => {
    const now = wallClockIn('Asia/Qatar', new Date('2026-10-05T12:30:00Z'))
    expect(dueReminders([lesson({ status: 'done' }), lesson({ status: 'cancelled' }), lesson({ reminderMin: null })], now, new Set())).toEqual([])
  })

  it('the 5-minute schedule exists and stays quiet without its secrets', () => {
    const wf = fs.readFileSync(path.join(__dirname, '../.github/workflows/worklog-reminders.yml'), 'utf8')
    expect(wf).toContain("cron: '*/5 * * * *'")
    expect(wf).toContain('/api/cron/worklog-reminders')
    expect(wf).toMatch(/-z "\$APP_URL"[\s\S]*exit 0/)
  })
})

describe('copying lessons to the owner\'s Notion database', () => {
  it('finds the database id in a link, with or without a view', () => {
    const id = '1a2b3c4d5e6f40718293a4b5c6d7e8f9'
    const dashed = '1a2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9'
    expect(parseNotionDbId(`https://www.notion.so/myspace/${id}?v=ffffffffffffffffffffffffffffffff`)).toBe(dashed)
    expect(parseNotionDbId(`https://www.notion.so/Lessons-${id}`)).toBe(dashed)
    expect(parseNotionDbId(dashed)).toBe(dashed)
    expect(parseNotionDbId('https://www.notion.so/no-id-here')).toBeNull()
  })

  const arabic: NotionProp[] = parseNotionSchema({
    properties: {
      'الاسم': { type: 'title' }, 'التاريخ': { type: 'date' }, 'الحالة': { type: 'status', status: { options: [{ name: 'مجدولة' }, { name: 'تمّت' }, { name: 'ملغاة' }] } },
      'السعر': { type: 'number' }, 'عدد الساعات': { type: 'number' }, 'العائلة': { type: 'select', select: { options: [] } }, 'ملاحظات': { type: 'rich_text' },
    },
  })

  it('guesses the columns from their names, each column once', () => {
    expect(guessNotionMap(arabic)).toEqual({
      title: 'الاسم', date: 'التاريخ', status: 'الحالة', price: 'السعر', duration: 'عدد الساعات', family: 'العائلة', note: 'ملاحظات',
    })
    const english = parseNotionSchema({ properties: { Name: { type: 'title' }, When: { type: 'date' }, Amount: { type: 'number' }, Student: { type: 'rich_text' } } })
    expect(guessNotionMap(english)).toEqual({ title: 'Name', date: 'When', price: 'Amount', child: 'Student' })
  })

  it('drops a mapping to a column that is gone or of the wrong type', () => {
    expect(validNotionMap({ title: 'الاسم', date: 'السعر', note: 'محذوف' }, arabic)).toEqual({ title: 'الاسم' })
  })

  it('writes the lesson in the work log\'s time zone, in each column\'s own shape', () => {
    const cfg = { databaseId: 'x', map: guessNotionMap(arabic) }
    const p = lessonNotionProperties(lesson({ durationMin: 90, status: 'done', child: 'تميم', note: 'تقييم' }), { name: 'أبو خالد', childName: 'خالد' }, cfg, arabic, { timezone: 'Asia/Qatar', currency: 'QAR' })
    expect(p['الاسم']).toEqual({ title: [{ type: 'text', text: { content: 'تميم — أبو خالد' } }] })
    expect(p['التاريخ']).toEqual({ date: { start: '2026-10-05T16:00:00', end: '2026-10-05T17:30:00', time_zone: 'Asia/Qatar' } })
    expect(p['الحالة']).toEqual({ status: { name: 'تمّت' } })
    expect(p['السعر']).toEqual({ number: 120 })
    expect(p['عدد الساعات']).toEqual({ number: 1.5 })
    expect(p['العائلة']).toEqual({ select: { name: 'أبو خالد' } })
  })

  it('a status column without «ملغاة (محتسبة)» still gets «ملغاة»; an unknown option is left alone', () => {
    const cfg = { databaseId: 'x', map: guessNotionMap(arabic) }
    const charged = lessonNotionProperties(lesson({ status: 'cancelled', charged: true }), undefined, cfg, arabic, { timezone: 'Asia/Qatar', currency: 'QAR' })
    expect(charged['الحالة']).toEqual({ status: { name: 'ملغاة' } })
    const bare = parseNotionSchema({ properties: { N: { type: 'title' }, S: { type: 'status', status: { options: [{ name: 'Done' }] } } } })
    const p = lessonNotionProperties(lesson(), undefined, { databaseId: 'x', map: { title: 'N', status: 'S' } }, bare, { timezone: 'Asia/Qatar', currency: 'QAR' })
    expect('S' in p).toBe(false)
  })
})
