// One place for every user-facing date, time and contact format.
//
// This exists because the same class of bug kept appearing: a value that looks
// correct on the developer's machine and wrong on the user's. Three concrete
// instances were found in one audit —
//
//   1. Bare 'ar' / 'ar-SA' let the browser choose the digit shape, so Node
//      showed 0-9 and other browsers showed Arabic-Indic numerals.
//   2. Fifteen call sites formatted dates with 'fr-FR' inside an Arabic UI, so
//      an Arabic-speaking parent read "16 sept." instead of "16 سبتمبر".
//   3. A date-only field like "2026-09-01" parses as UTC midnight, so anyone
//      west of UTC saw the PREVIOUS day. Invisible in Qatar and Tunisia, wrong
//      for a family in the Americas.
//
// Each of those is one line of correct code; the problem was that the line was
// written 30 times. Now it is written once.
import type { Lang } from './i18n'

/**
 * Arabic with Latin numerals. The bare 'ar' tag leaves digit shape to the
 * browser's ICU data, which is not something to leave to chance.
 */
export const ARABIC_LOCALE = 'ar-u-nu-latn'

/** The BCP-47 tag for a UI language. */
export function localeFor(lang: Lang): string {
  return lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : ARABIC_LOCALE
}

/** A bare calendar date with no time part, e.g. "2026-09-01". */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * Format a DATE-ONLY value (birth dates, appointment dates, report periods).
 *
 * Pinned to UTC on purpose. `new Date("2026-09-01")` is midnight UTC, so
 * rendering it in a negative-offset zone yields 31 August — a report period
 * that silently starts a day early for a family abroad. Values that carry a
 * real time (createdAt, completedAt) must NOT come through here; use
 * formatDateTime, which correctly shows the viewer's own local time.
 */
export function formatDateOnly(
  value: string | null | undefined,
  locale: string,
  opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  // A full timestamp handed to this function would be shifted wrongly, so only
  // pin the zone when the input really is date-only.
  const timeZone = DATE_ONLY.test(value.slice(0, 10)) && value.length <= 10 ? 'UTC' : undefined
  return d.toLocaleDateString(locale, { ...opts, ...(timeZone ? { timeZone } : {}) })
}

/** Format a real timestamp (createdAt, completedAt) in the viewer's own zone. */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  locale: string,
  opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  if (value === null || value === undefined || value === '') return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, opts)
}

/** Format the clock time of a real timestamp, in the viewer's own zone. */
export function formatTime(
  value: string | number | Date | null | undefined,
  locale: string,
  opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
): string {
  if (value === null || value === undefined || value === '') return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(locale, opts)
}

/**
 * The academy's WhatsApp number, as wa.me requires it: digits only.
 *
 * Four different fallbacks were in the code for the same number, including a
 * placeholder ('21600000000') that reaches nobody and a '+'-prefixed form that
 * wa.me does not accept. A parent who tapped the landing page's WhatsApp
 * button with the env var unset reached a dead number.
 */
export const WHATSAPP_FALLBACK = '97430653759'

export function whatsappNumber(): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || WHATSAPP_FALLBACK
  // wa.me takes the international number with no +, spaces, dashes or brackets.
  const digits = raw.replace(/\D/g, '')
  return digits || WHATSAPP_FALLBACK
}

/** A ready wa.me link, with the message already encoded. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${whatsappNumber()}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
