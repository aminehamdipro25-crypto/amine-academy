'use client'

export function reportError(error: Error | string, extra?: Record<string, unknown>) {
  const message = typeof error === 'string' ? error : error.message
  const stack   = typeof error === 'string' ? undefined : error.stack
  fetch('/api/monitor/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      stack,
      url:       typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      level: 'error',
      ...extra,
    }),
  }).catch(() => {}) // never throw
}

// Install global unhandled error + promise rejection handlers
export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined') return
  window.addEventListener('error', (e) => {
    reportError(e.error ?? e.message ?? 'Unknown error')
  })
  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason instanceof Error ? e.reason.message : String(e.reason ?? 'Unhandled rejection')
    reportError(msg)
  })
}
