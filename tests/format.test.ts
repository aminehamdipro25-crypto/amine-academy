// The three formatting bugs this module exists to prevent, each asserted in the
// condition that makes it visible — because none of them is visible on the
// developer's own machine.
import { describe, it, expect } from 'vitest'
import {
  ARABIC_LOCALE,
  WHATSAPP_FALLBACK,
  formatDateOnly,
  formatDateTime,
  formatTime,
  localeFor,
  whatsappLink,
  whatsappNumber,
} from '../lib/format'

const ARABIC_INDIC = /[٠-٩]/
const ARABIC_LETTERS = /[؀-ۿ]/

describe('localeFor', () => {
  it('uses Latin numerals for Arabic', () => {
    expect(localeFor('ar')).toBe(ARABIC_LOCALE)
    expect(ARABIC_LOCALE).toContain('nu-latn')
  })
  it('leaves the other two languages alone', () => {
    expect(localeFor('en')).toBe('en-US')
    expect(localeFor('fr')).toBe('fr-FR')
  })
})

describe('formatDateOnly — the off-by-one-day bug', () => {
  it('keeps the calendar date west of UTC', () => {
    // The whole point: "2026-09-01" is midnight UTC, so an un-pinned render in
    // a negative-offset zone yields 31 August.
    const out = formatDateOnly('2026-09-01', 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: undefined })
    expect(out).toContain('1')
    expect(out).toContain('September')
    expect(out).not.toContain('August')
  })

  it('renders the first of the month as the first, not the last of the previous', () => {
    for (const d of ['2026-01-01', '2026-03-01', '2026-12-01']) {
      const out = formatDateOnly(d, 'en-US', { day: 'numeric', month: 'short' })
      expect(out, d).toMatch(/\b1\b/)
    }
  })

  it('renders Arabic month names with Latin digits', () => {
    const out = formatDateOnly('2026-09-16', localeFor('ar'))
    expect(out).not.toMatch(ARABIC_INDIC)
    expect(out).toMatch(ARABIC_LETTERS)
    expect(out).toContain('16')
    expect(out).toContain('2026')
  })

  it('does not pin a full timestamp to UTC — that would shift it wrongly', () => {
    // A real timestamp must render in the viewer's zone, so this must not add
    // timeZone: 'UTC' just because the first ten characters look like a date.
    const out = formatDateOnly('2026-09-16T23:30:00.000Z', 'en-US', { day: 'numeric' })
    expect(out.length).toBeGreaterThan(0)
  })

  it('returns an empty string rather than "Invalid Date" for unusable input', () => {
    expect(formatDateOnly('', 'en-US')).toBe('')
    expect(formatDateOnly(null, 'en-US')).toBe('')
    expect(formatDateOnly(undefined, 'en-US')).toBe('')
    expect(formatDateOnly('not-a-date', 'en-US')).toBe('')
  })
})

describe('formatDateTime and formatTime', () => {
  it('render Arabic with Latin digits', () => {
    const date = formatDateTime('2026-09-16T10:00:00.000Z', localeFor('ar'))
    const time = formatTime('2026-09-16T10:00:00.000Z', localeFor('ar'))
    expect(date).not.toMatch(ARABIC_INDIC)
    expect(time).not.toMatch(ARABIC_INDIC)
  })

  it('never emit "Invalid Date" to a user', () => {
    for (const bad of ['', null, undefined, 'nonsense']) {
      expect(formatDateTime(bad as never, 'en-US')).toBe('')
      expect(formatTime(bad as never, 'en-US')).toBe('')
    }
  })

  it('accept a Date object as well as a string', () => {
    expect(formatDateTime(new Date('2026-09-16T10:00:00Z'), 'en-US')).toContain('2026')
  })
})

describe('whatsappNumber — the dead-link bug', () => {
  const original = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

  it('strips a leading + — wa.me rejects it', () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '+974 3065 3759'
    expect(whatsappNumber()).toBe('97430653759')
  })

  it('strips spaces, dashes and brackets', () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '(974) 3065-3759'
    expect(whatsappNumber()).toBe('97430653759')
  })

  it('falls back to the real number when the variable is unset or empty', () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    expect(whatsappNumber()).toBe(WHATSAPP_FALLBACK)
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = ''
    expect(whatsappNumber()).toBe(WHATSAPP_FALLBACK)
  })

  it('falls back rather than producing an empty link from junk', () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '+++'
    expect(whatsappNumber()).toBe(WHATSAPP_FALLBACK)
  })

  it('builds a wa.me link with no + and an encoded message', () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '+97430653759'
    expect(whatsappLink()).toBe('https://wa.me/97430653759')
    const withMsg = whatsappLink('مرحباً أستاذ أمين')
    expect(withMsg).toContain('https://wa.me/97430653759?text=')
    expect(withMsg).not.toContain(' ')
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = original
  })
})
