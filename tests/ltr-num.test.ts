// `.ltr-num` sets `direction: ltr`. In an RTL page that moves a LEADING number
// to the END of the line: "16 سبتمبر 2026 · الأستاذ أمين" renders as
// "سبتمبر 2026 · الأستاذ أمين 16", and "5 مرة" renders as "مرة 5". Measured in a
// real browser, every number-then-Arabic string tested was reversed by it and
// correct without it.
//
// The class is for content that is entirely digits/Latin (a clock, an ISO date,
// a phone number), where RTL reordering would genuinely break it. Digits are
// already Latin everywhere via the ar-u-nu-latn locale, so mixed Arabic prose
// never needs it.
//
// This guards the direction that is actually wrong — a number first, Arabic
// after. Arabic-first strings ("آخر تحديث: 12:30") are unaffected either way.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..')
const SKIP = new Set(['node_modules', '.next', '.git', 'tests'])
const ARABIC = /[؀-ۿ]/

// Same walk the numerals drift test uses — no extra dependency for a lint check.
function sourceFiles(dir = ROOT, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue
    if (SKIP.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) sourceFiles(full, out)
    else if (entry.name.endsWith('.tsx')) out.push(full)
  }
  return out
}

/** Inline text of the element the class sits on, as far as the closing tag. */
function inlineBody(lines: string[], i: number): string {
  const window = lines.slice(i, i + 3).join('\n')
  const afterTag = window.split('>').slice(1).join('>')
  return afterTag.split('</')[0]
}

/** Does the body open with a number or a numeric expression, then Arabic? */
function numberLeadsArabic(body: string): boolean {
  const text = body.trim()
  if (!ARABIC.test(text)) return false
  // A leading literal digit, or a leading {expression} that is not a string of
  // Arabic itself — both render as an LTR run before the Arabic that follows.
  const leadingNumber = /^[+×-]?\d/.test(text)
  const leadingExpr = /^(\{[^}]*\}|<ACountUp\b)/.test(text) && !ARABIC.test(text.split(/[}>]/)[0] ?? '')
  if (!leadingNumber && !leadingExpr) return false
  const rest = text.replace(/^(\{[^}]*\}|<ACountUp[^>]*\/>|[+×-]?[\d:.\/-]+)/, '')
  return ARABIC.test(rest)
}

describe('ltr-num never wraps a number followed by Arabic', () => {
  const files = sourceFiles()

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it('has no element where the class would reverse the reading order', () => {
    const offenders: string[] = []
    for (const file of files) {
      const lines = fs.readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (!line.includes('ltr-num')) return
        const body = inlineBody(lines, i)
        if (numberLeadsArabic(body)) {
          offenders.push(`${file.replace(ROOT + '/', '')}:${i + 1} → ${body.trim().slice(0, 70)}`)
        }
      })
    }
    expect(offenders, `ltr-num reverses these in RTL:\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('the detector itself', () => {
  it('flags the shapes that were actually broken', () => {
    for (const s of ['{n} مرة', '30 دقيقة', '{ex.ageMin}-{ex.ageMax}س', '+6 نجوم', '<ACountUp value={n} /> تمارين']) {
      expect(numberLeadsArabic(s), s).toBe(true)
    }
  })

  it('leaves alone what the class is legitimately for', () => {
    for (const s of ['{score}%', '72%', '{formatTime(t)}', '2017-04-12', '+974 1234 5678']) {
      expect(numberLeadsArabic(s), s).toBe(false)
    }
  })

  it('does not flag Arabic-first strings, which render the same either way', () => {
    for (const s of ['آخر تحديث: {time}', 'لعبتها {n} مرة ✓', 'المرحلة الحالية: {phase}']) {
      expect(numberLeadsArabic(s), s).toBe(false)
    }
  })
})
