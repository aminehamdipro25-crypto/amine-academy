import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import tailwindConfig from '../tailwind.config'

// Regression test for the MemoryCards/achievement-toast bug class: a Tailwind
// arbitrary-value animation (animate-[name_...]) silently no-ops if "name"
// isn't backed by a real @keyframes rule anywhere in the project.

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, exts, out)
    else if (exts.some(e => entry.name.endsWith(e))) out.push(full)
  }
  return out
}

// Tailwind ships these keyframes in its default theme (not in theme.extend)
const TAILWIND_BUILTIN_KEYFRAMES = ['spin', 'ping', 'pulse', 'bounce']

function definedKeyframeNames(allFiles: string[]): Set<string> {
  const names = new Set<string>(TAILWIND_BUILTIN_KEYFRAMES)

  const extendKeyframes = (tailwindConfig as { theme?: { extend?: { keyframes?: Record<string, unknown> } } })
    .theme?.extend?.keyframes ?? {}
  for (const name of Object.keys(extendKeyframes)) names.add(name)

  const root = path.resolve(__dirname, '..')
  const css = readFileSync(path.join(root, 'app/globals.css'), 'utf8')
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) names.add(m[1])

  // Components also define their own @keyframes inside inline <style> blocks
  for (const file of allFiles) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/@keyframes\s+([\w-]+)/g)) names.add(m[1])
  }

  return names
}

function usedArbitraryAnimationNames(files: string[]): { name: string; file: string }[] {
  const root = path.resolve(__dirname, '..')
  const found: { name: string; file: string }[] = []
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/animate-\[([a-zA-Z0-9-]+)_/g)) {
      found.push({ name: m[1], file: path.relative(root, file) })
    }
  }
  return found
}

describe('Tailwind arbitrary animations reference real @keyframes', () => {
  it('every animate-[name_...] usage has a matching keyframes definition', () => {
    const root = path.resolve(__dirname, '..')
    const files = [
      ...walk(path.join(root, 'app'), ['.tsx', '.ts']),
      ...walk(path.join(root, 'components'), ['.tsx', '.ts']),
    ]
    const defined = definedKeyframeNames(files)
    const used = usedArbitraryAnimationNames(files)
    const missing = used.filter(u => !defined.has(u.name))
    expect(missing, JSON.stringify(missing, null, 2)).toEqual([])
  })
})
