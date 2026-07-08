import 'server-only'
import Pusher from 'pusher'

// ── Real-time publish layer (server side) ────────────────────────────────
//
// Design: "wake-up + Redis-as-truth". Every session mutation still writes to
// Redis (the durable source of truth, used for late-joiners and as the
// fallback path). On top of that, we publish a tiny wake-up event to a
// Pusher channel so the other party re-fetches that one channel INSTANTLY
// instead of waiting for the next poll tick. We intentionally do NOT ship
// the payload over Pusher — the receiver re-reads Redis — so a malformed or
// out-of-order message can never corrupt state, and there's nothing to
// validate on the wire.
//
// If Pusher isn't configured (no env vars), publish() is a no-op and the
// clients simply keep fast-polling. So the whole app works with or without
// Pusher; adding the keys upgrades latency from ~1s to ~100ms with zero code
// changes elsewhere.

export type SessionEvent =
  | 'live'
  | 'content'
  | 'whiteboard'
  | 'timer'
  | 'noise'
  | 'card'
  | 'kid-status'
  | 'presence'

let cached: Pusher | null = null
let resolved = false

function getPusher(): Pusher | null {
  if (resolved) return cached
  resolved = true
  const appId   = process.env.PUSHER_APP_ID
  const key     = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY
  const secret  = process.env.PUSHER_SECRET
  const cluster = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  if (!appId || !key || !secret || !cluster) {
    cached = null
    return null
  }
  cached = new Pusher({ appId, key, secret, cluster, useTLS: true })
  return cached
}

export function isRealtimeConfigured(): boolean {
  return getPusher() !== null
}

function channelFor(sessionId: string): string {
  // Pusher channel names allow [A-Za-z0-9_\-=@,.;] — appointment ids are
  // already restricted to that set, but sanitize defensively.
  return `session-${String(sessionId).replace(/[^A-Za-z0-9_\-]/g, '')}`
}

// Fire-and-forget wake-up. Never throws — a realtime hiccup must never break
// the underlying Redis write that already succeeded.
export async function publishSessionEvent(sessionId: string, event: SessionEvent): Promise<void> {
  const pusher = getPusher()
  if (!pusher || !sessionId) return
  try {
    await pusher.trigger(channelFor(sessionId), event, { t: Date.now() })
  } catch {
    /* ignore — clients still catch up via the fallback poll */
  }
}
