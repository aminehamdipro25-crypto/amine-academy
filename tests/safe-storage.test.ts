// Storage must never throw. The condition that matters is not "storage works"
// — it is "the user blocked site data", which is where the real crash was.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  readStorage,
  readStorageJson,
  removeStorage,
  writeStorage,
  writeStorageJson,
} from '../lib/safe-storage'

const realWindow = globalThis.window

function installStorage(impl: Partial<Storage>) {
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: impl, sessionStorage: impl },
    configurable: true,
    writable: true,
  })
}

function workingStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v) },
    removeItem: (k: string) => { map.delete(k) },
  } as unknown as Storage
}

/** What a browser with site data blocked actually does. */
function blockedStorage() {
  const boom = () => { throw new DOMException('The operation is insecure.', 'SecurityError') }
  return { getItem: boom, setItem: boom, removeItem: boom } as unknown as Storage
}

function fullStorage() {
  return {
    getItem: () => null,
    setItem: () => { throw new DOMException('quota', 'QuotaExceededError') },
    removeItem: () => {},
  } as unknown as Storage
}

afterEach(() => {
  Object.defineProperty(globalThis, 'window', { value: realWindow, configurable: true, writable: true })
})

describe('working storage', () => {
  beforeEach(() => installStorage(workingStorage()))

  it('round-trips a string', () => {
    expect(writeStorage('k', 'v')).toBe(true)
    expect(readStorage('k')).toBe('v')
  })

  it('round-trips JSON', () => {
    expect(writeStorageJson('j', { a: 1, b: [2, 3] })).toBe(true)
    expect(readStorageJson('j', null)).toEqual({ a: 1, b: [2, 3] })
  })

  it('removes a key', () => {
    writeStorage('k', 'v')
    removeStorage('k')
    expect(readStorage('k')).toBeNull()
  })

  it('returns the fallback for a key that was never written', () => {
    expect(readStorage('missing')).toBeNull()
    expect(readStorageJson('missing', 'fb')).toBe('fb')
  })
})

describe('storage blocked by the user — the crash this prevents', () => {
  beforeEach(() => installStorage(blockedStorage()))

  it('reads fall back instead of throwing', () => {
    expect(() => readStorage('k')).not.toThrow()
    expect(readStorage('k')).toBeNull()
    expect(readStorageJson('k', 'fb')).toBe('fb')
  })

  it('writes report failure instead of throwing', () => {
    expect(() => writeStorage('k', 'v')).not.toThrow()
    expect(writeStorage('k', 'v')).toBe(false)
    expect(writeStorageJson('k', { a: 1 })).toBe(false)
  })

  it('removal does not throw', () => {
    expect(() => removeStorage('k')).not.toThrow()
  })
})

describe('storage full', () => {
  beforeEach(() => installStorage(fullStorage()))

  it('reports a failed write rather than throwing QuotaExceededError', () => {
    expect(writeStorage('k', 'v')).toBe(false)
  })
})

describe('no window at all (server render)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true, writable: true })
  })

  it('reads and writes are inert', () => {
    expect(readStorage('k')).toBeNull()
    expect(writeStorage('k', 'v')).toBe(false)
    expect(readStorageJson('k', 42)).toBe(42)
    expect(() => removeStorage('k')).not.toThrow()
  })
})

describe('corrupt stored JSON', () => {
  beforeEach(() => {
    const s = workingStorage()
    s.setItem('bad', '{not json')
    s.setItem('nul', 'null')
    installStorage(s)
  })

  it('falls back rather than throwing a parse error', () => {
    expect(readStorageJson('bad', { safe: true })).toEqual({ safe: true })
  })

  it('treats a stored null as absent', () => {
    expect(readStorageJson('nul', 'fb')).toBe('fb')
  })
})

describe('unserialisable value', () => {
  beforeEach(() => installStorage(workingStorage()))

  it('reports failure on a circular structure rather than throwing', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(writeStorageJson('c', circular)).toBe(false)
  })
})
