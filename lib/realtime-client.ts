'use client'
import PusherClient from 'pusher-js'
import type { SessionEvent } from './realtime-server'

// ── Real-time subscribe layer (client side) ──────────────────────────────
//
// Mirrors realtime-server.ts: a single Pusher connection per browser tab,
// subscribed to `session-{id}`. On each wake-up event we call the caller's
// handler for that channel, which re-fetches Redis (the source of truth).
//
// When Pusher isn't configured, subscribeSession() returns a no-op unsub and
// realtimeEnabled() is false — the caller then keeps its fast fallback poll.
// When it IS configured, the caller can slow its poll to a rare safety net.

export function realtimeEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER)
}

// One shared Pusher connection for the whole tab, reference-counted so
// multiple components (e.g. several channels on one page) share a single
// WebSocket instead of opening one each.
let shared: PusherClient | null = null
let refs = 0

function acquire(): PusherClient | null {
  if (!realtimeEnabled()) return null
  if (!shared) {
    shared = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      // These are public broadcast channels (no PII on the wire — payloads
      // are just wake-up pings; the real data is re-fetched over the
      // auth-gated API), so no auth endpoint is needed.
    })
  }
  refs++
  return shared
}

function release() {
  refs = Math.max(0, refs - 1)
  if (refs === 0 && shared) {
    shared.disconnect()
    shared = null
  }
}

function channelFor(sessionId: string): string {
  return `session-${String(sessionId).replace(/[^A-Za-z0-9_\-]/g, '')}`
}

/**
 * Subscribe to a session's real-time wake-up events. `onEvent` fires with the
 * channel name that changed; the caller should re-fetch just that channel.
 * Returns an unsubscribe function. No-op (returns a noop) when Pusher isn't
 * configured.
 */
export function subscribeSession(
  sessionId: string,
  onEvent: (event: SessionEvent) => void,
): () => void {
  const client = acquire()
  if (!client || !sessionId) return () => {}

  const channel = client.subscribe(channelFor(sessionId))
  const EVENTS: SessionEvent[] = ['live', 'content', 'whiteboard', 'timer', 'noise', 'card', 'kid-status', 'presence', 'readiness']
  const handlers = EVENTS.map(ev => {
    const h = () => onEvent(ev)
    channel.bind(ev, h)
    return [ev, h] as const
  })

  return () => {
    handlers.forEach(([ev, h]) => channel.unbind(ev, h))
    client.unsubscribe(channelFor(sessionId))
    release()
  }
}
