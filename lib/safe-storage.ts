// Browser storage that cannot throw.
//
// localStorage and sessionStorage are not always available: Safari in private
// mode used to throw on setItem, every browser throws when the user blocks site
// data, and both are absent during server rendering. An unguarded call is not a
// lost preference — it is an exception, and where that call sits inside a React
// provider or effect it takes the whole page down with it.
//
// The worst instance found in this codebase was LanguageProvider, which runs on
// every page of the site: a visitor with site data blocked would have seen a
// blank app, not an app in the wrong language.
//
// Reads return the fallback and writes are dropped. A remembered preference is
// a convenience; nothing here is allowed to be load-bearing.

type Kind = 'local' | 'session'

function store(kind: Kind): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readStorage(key: string, kind: Kind = 'local'): string | null {
  try {
    return store(kind)?.getItem(key) ?? null
  } catch {
    return null
  }
}

/** Returns false when the value could not be stored, so callers can tell. */
export function writeStorage(key: string, value: string, kind: Kind = 'local'): boolean {
  try {
    const s = store(kind)
    if (!s) return false
    s.setItem(key, value)
    return true
  } catch {
    // Also covers QuotaExceededError, which is a real outcome on a full profile.
    return false
  }
}

export function removeStorage(key: string, kind: Kind = 'local'): void {
  try {
    store(kind)?.removeItem(key)
  } catch {
    /* nothing to do — the value is already unreachable */
  }
}

/**
 * Read and JSON.parse in one step.
 *
 * Corrupt stored JSON is as likely as unavailable storage — a half-written
 * value from a closed tab, or a shape from an older release — and must also
 * fall back rather than throw.
 */
export function readStorageJson<T>(key: string, fallback: T, kind: Kind = 'local'): T {
  const raw = readStorage(key, kind)
  if (raw === null) return fallback
  try {
    const parsed = JSON.parse(raw)
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

export function writeStorageJson(key: string, value: unknown, kind: Kind = 'local'): boolean {
  try {
    return writeStorage(key, JSON.stringify(value), kind)
  } catch {
    // JSON.stringify itself throws on a circular structure.
    return false
  }
}
