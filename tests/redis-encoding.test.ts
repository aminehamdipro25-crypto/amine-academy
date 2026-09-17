// `redis.set(key, value)` serialises `value` itself (lib/redis.ts). Passing an
// already-stringified value therefore stores a JSON-encoded JSON string.
//
// It does not blow up, which is why three call sites had drifted into it and
// stayed: `parseEntry` tries a second parse and keeps the result when it looks
// like an object. But that recovery is a guess, and it is explicitly refused for
// values that parse to a scalar — the comment there is "never coerce
// '572180' → 572180". So a double-encoded record survives only by luck of
// being an object, and anything read raw (a migration, a debug endpoint, a
// future consumer) sees a string where a record should be.
//
// The pipeline form is different: there the caller builds the command, so
// `['SET', key, JSON.stringify(x)]` is correct and required.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..')
const SKIP = new Set(['node_modules', '.next', '.git', 'tests'])

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

/** `redis.set(<anything>, JSON.stringify(...))` — the double-encoding shape. */
const DOUBLE_ENCODE = /redis\.set\(\s*[^,]+,\s*JSON\.stringify\(/

describe('redis.set is never handed an already-serialised value', () => {
  it('has no double-encoding call site', () => {
    const offenders: string[] = []
    for (const file of sourceFiles()) {
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (DOUBLE_ENCODE.test(line)) {
          offenders.push(`${file.replace(ROOT + '/', '')}:${i + 1} → ${line.trim().slice(0, 80)}`)
        }
      })
    }
    expect(offenders, `redis.set serialises internally:\n${offenders.join('\n')}`).toEqual([])
  })

  it('does not flag the pipeline form, where the caller must serialise', () => {
    const ok = "    ['SET', `assessment:${id}`, JSON.stringify(result)],"
    expect(DOUBLE_ENCODE.test(ok)).toBe(false)
  })

  it('flags the shape that was actually wrong', () => {
    expect(DOUBLE_ENCODE.test('await redis.set(`exercise:${id}`, JSON.stringify(updated))')).toBe(true)
  })
})

describe('clinical records are never written with an expiry', () => {
  // Assessments, APA session records and learning-difficulty profiles each
  // carried EX 31536000 — one year — while the index lists pointing at them had
  // none. A child followed for longer than a year lost their earliest records
  // silently: the ids stayed in the list and the records behind them returned
  // null, so the history simply looked shorter than it was.
  const CLINICAL = ['assessment:', 'apa-record:', 'ld-profile:', 'report:']

  it('no write of a clinical key sets EX or ex', () => {
    const offenders: string[] = []
    for (const file of sourceFiles()) {
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (!CLINICAL.some(k => line.includes(`\`${k}$`))) return
        if (!/\bSET\b|redis\.set\(/.test(line)) return
        if (/'EX'|"EX"|\bex:\s*\d/.test(line)) {
          offenders.push(`${file.replace(ROOT + '/', '')}:${i + 1} → ${line.trim().slice(0, 90)}`)
        }
      })
    }
    expect(offenders, `clinical records must not expire:\n${offenders.join('\n')}`).toEqual([])
  })

  it('flags the shape that was actually wrong', () => {
    const bad = "['SET', `assessment:${id}`, JSON.stringify(result), 'EX', String(365 * 24 * 3600)],"
    expect(CLINICAL.some(k => bad.includes(`\`${k}$`)) && /'EX'/.test(bad)).toBe(true)
  })
})

describe('a child\'s clinical history is never read through a small window', () => {
  // These lists are a record, not a recent-activity feed. Capped at 21 they hid
  // a child's earlier reports from their own family's portal and from the admin
  // data export, and hid earlier assessments from the report's scale-to-scale
  // comparison — after only four sessions of five scales. The records themselves
  // were sitting there permanently.
  //
  // The appointment list had a sharper edge: an ownership check read it to
  // decide whether an appointment belonged to the caller, so a parent with a
  // longer history was refused access to their OWN older appointment.
  const RECORD_LISTS = ['reports:student:', 'assessments:student:', 'appointments:parent:']

  it('reads the whole list wherever one of these is opened', () => {
    const offenders: string[] = []
    for (const file of sourceFiles()) {
      const lines = fs.readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (!RECORD_LISTS.some(k => line.includes(k))) return
        if (!line.includes('lrange(')) return
        // A read that feeds a model's context rather than a screen may be
        // bounded on purpose, but it has to say so in the four lines above it.
        if (lines.slice(Math.max(0, i - 4), i).some(l => l.includes('prompt-window'))) return
        // Either an explicit -1, or a `limit` variable the caller controls.
        const readsAll = /,\s*-1\s*\)/.test(line) || /limit/.test(line)
        if (!readsAll) {
          offenders.push(`${file.replace(ROOT + '/', '')}:${i + 1} → ${line.trim().slice(0, 90)}`)
        }
      })
    }
    expect(offenders, `clinical history read through a window:\n${offenders.join('\n')}`).toEqual([])
  })

  it('flags the shape that was actually wrong', () => {
    const bad = 'const ids = await redis.lrange(`reports:student:${studentId}`, 0, 20)'
    const readsAll = /,\s*-1\s*\)/.test(bad) || /limit/.test(bad)
    expect(readsAll).toBe(false)
  })
})
