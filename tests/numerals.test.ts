// Digits must render Western (0-9), never Arabic-Indic (٠-٩).
//
// Two separate sources produced them, and both are guarded here because a
// reader who sees ١٢٣ in one place and 123 in another reads an inconsistent
// product — and the specialist asked for Western digits throughout.
//
//   1. Literals typed straight into the source (stat: '٤').
//   2. Date/number formatting under a bare 'ar' or 'ar-SA' locale, which some
//      browsers render with Arabic-Indic digits even though Node does not —
//      so this cannot be caught by eyeballing it locally.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..')
const SKIP = new Set(['node_modules', '.next', '.git', 'tests'])
const ARABIC_INDIC = /[٠-٩]/

function sourceFiles(dir = ROOT, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue
    if (SKIP.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) sourceFiles(full, out)
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

const FILES = sourceFiles()

describe('numeral rendering', () => {
  it('finds the source tree (guards against a silently empty sweep)', () => {
    expect(FILES.length).toBeGreaterThan(100)
  })

  it('has no Arabic-Indic digits anywhere in the source', () => {
    const offenders: string[] = []
    for (const file of FILES) {
      const lines = fs.readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (ARABIC_INDIC.test(line)) {
          offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 80)}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })

  it('never formats dates or numbers under a bare Arabic locale', () => {
    // 'ar' and 'ar-SA' hand digit shape to the browser's ICU data. The explicit
    // '-u-nu-latn' extension is the only form that guarantees Latin digits.
    const bad = /toLocale\w*\(\s*['"]ar(-SA|-EG)?['"]/
    const offenders: string[] = []
    for (const file of FILES) {
      const lines = fs.readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (bad.test(line)) {
          offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 80)}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })

  it("every localeFor helper returns the Latin-numeral Arabic tag", () => {
    const offenders: string[] = []
    for (const file of FILES) {
      const src = fs.readFileSync(file, 'utf8')
      if (!src.includes('function localeFor')) continue
      if (!src.includes("'ar-u-nu-latn'")) {
        offenders.push(path.relative(ROOT, file))
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('the locale tag actually produces Latin digits', () => {
  it('renders a date with 0-9 and Arabic month names', () => {
    const d = new Date('2026-09-16T10:00:00Z')
    const out = d.toLocaleDateString('ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    expect(out).not.toMatch(ARABIC_INDIC)
    expect(out).toMatch(/\d/)
    // Still Arabic — this is a numeral fix, not a language change.
    expect(out).toMatch(/[؀-ۿ]/)
  })

  it('renders a number with 0-9', () => {
    const out = (1234).toLocaleString('ar-u-nu-latn')
    expect(out).not.toMatch(ARABIC_INDIC)
    expect(out).toMatch(/1.?234/)
  })

  it('renders a time with 0-9', () => {
    const out = new Date('2026-09-16T10:05:00Z')
      .toLocaleTimeString('ar-u-nu-latn', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    expect(out).not.toMatch(ARABIC_INDIC)
  })
})

describe('locale leakage', () => {
  it('never formats with a French locale outside the French UI path', () => {
    // An Arabic-speaking parent read "16 sept." in their own report because the
    // locale was hardcoded, or assigned to a variable the pattern sweep missed.
    // Both shapes are blocked here.
    const offenders: string[] = []
    for (const file of FILES) {
      const lines = fs.readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        const st = line.trim()
        if (st.startsWith('//') || st.startsWith('*')) return
        if (!line.includes("'fr-FR'")) return
        // The only legitimate use: choosing fr-FR because the UI IS French.
        if (/lang === 'fr'\s*\?\s*'fr-FR'/.test(line) && !/'ar'\s*\?\s*'fr-FR'/.test(line)) return
        offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${st.slice(0, 90)}`)
      })
    }
    expect(offenders).toEqual([])
  })

  it('has no second definition of the locale mapping outside lib/format', () => {
    // Eight copies of localeFor drifted independently; one of them is how
    // 'ar-TN' and 'fr-FR' ended up mapped to Arabic in different files.
    const offenders: string[] = []
    for (const file of FILES) {
      if (file.endsWith(path.join('lib', 'format.ts'))) continue
      const src = fs.readFileSync(file, 'utf8')
      if (/function\s+localeFor\s*\(/.test(src)) offenders.push(path.relative(ROOT, file))
    }
    expect(offenders).toEqual([])
  })
})
