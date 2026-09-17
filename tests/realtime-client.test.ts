// The session page holds several subscriptions to the SAME channel at once —
// the readiness effect, the main session effect, and StoryReader while an
// exercise is open. pusher-js keeps no per-binding reference count:
// `unsubscribe(name)` drops the whole channel. So whichever of them unmounted
// first killed realtime for the others, while the connection indicator went on
// showing "مباشر" because the socket itself was still connected.
//
// The stub below reproduces exactly that behaviour — a shared channel object
// per name, `unsubscribe` removing it outright, and an `emit` that only reaches
// handlers still bound to a live channel.
import { describe, it, expect, beforeEach, vi } from 'vitest'

type Handler = () => void

class FakeChannel {
  bindings = new Map<string, Set<Handler>>()
  live = true
  bind(ev: string, h: Handler) {
    if (!this.bindings.has(ev)) this.bindings.set(ev, new Set())
    this.bindings.get(ev)!.add(h)
  }
  unbind(ev: string, h: Handler) { this.bindings.get(ev)?.delete(h) }
  emit(ev: string) {
    if (!this.live) return          // a dropped channel delivers nothing
    this.bindings.get(ev)?.forEach(h => h())
  }
}

class FakePusher {
  static instances: FakePusher[] = []
  channels = new Map<string, FakeChannel>()
  disconnected = false
  connection = {
    state: 'connected',
    bind: vi.fn(),
    unbind: vi.fn(),
  }
  constructor() { FakePusher.instances.push(this) }
  subscribe(name: string) {
    // pusher-js returns the SAME channel object for a repeated subscribe.
    if (!this.channels.has(name)) this.channels.set(name, new FakeChannel())
    return this.channels.get(name)!
  }
  unsubscribe(name: string) {
    const ch = this.channels.get(name)
    if (ch) ch.live = false          // the whole channel goes, not one binding
    this.channels.delete(name)
  }
  disconnect() { this.disconnected = true }
}

vi.mock('pusher-js', () => ({ default: FakePusher }))

const ENV = { ...process.env }

beforeEach(() => {
  vi.resetModules()
  FakePusher.instances = []
  process.env = { ...ENV, NEXT_PUBLIC_PUSHER_KEY: 'k', NEXT_PUBLIC_PUSHER_CLUSTER: 'eu' }
})

async function load() {
  return import('../lib/realtime-client')
}

describe('two subscribers on one session channel', () => {
  it('keeps delivering to the second after the first unsubscribes', async () => {
    const { subscribeSession } = await load()

    const a: string[] = []
    const b: string[] = []
    const unsubA = subscribeSession('S1', e => a.push(e))
    subscribeSession('S1', e => b.push(e))

    const client = FakePusher.instances[0]
    const channel = client.channels.get('session-S1')!

    channel.emit('progress')
    expect(a).toEqual(['progress'])
    expect(b).toEqual(['progress'])

    // StoryReader closes at the end of an exercise, say.
    unsubA()

    channel.emit('progress')
    expect(a, 'the one that left must stop receiving').toEqual(['progress'])
    expect(b, 'the one still mounted must keep receiving').toEqual(['progress', 'progress'])
  })

  it('drops the channel only when the last subscriber leaves', async () => {
    const { subscribeSession } = await load()
    const unsubA = subscribeSession('S1', () => {})
    const unsubB = subscribeSession('S1', () => {})
    const client = FakePusher.instances[0]

    unsubA()
    expect(client.channels.has('session-S1'), 'still in use').toBe(true)
    unsubB()
    expect(client.channels.has('session-S1'), 'last one out').toBe(false)
  })

  it('shares one socket rather than opening one per subscriber', async () => {
    const { subscribeSession } = await load()
    subscribeSession('S1', () => {})
    subscribeSession('S1', () => {})
    subscribeSession('S2', () => {})
    expect(FakePusher.instances.length).toBe(1)
  })

  it('separate sessions do not affect each other', async () => {
    const { subscribeSession } = await load()
    const unsub1 = subscribeSession('S1', () => {})
    subscribeSession('S2', () => {})
    const client = FakePusher.instances[0]

    unsub1()
    expect(client.channels.has('session-S1')).toBe(false)
    expect(client.channels.has('session-S2')).toBe(true)
  })
})

describe('cleanup that runs more than once', () => {
  it('does not drop a channel another subscriber still holds', async () => {
    const { subscribeSession } = await load()
    const unsubA = subscribeSession('S1', () => {})
    subscribeSession('S1', () => {})
    const client = FakePusher.instances[0]

    unsubA()
    unsubA()  // a double cleanup would otherwise decrement twice
    expect(client.channels.has('session-S1')).toBe(true)
  })

  it('does not tear down the socket early', async () => {
    const { subscribeSession } = await load()
    const unsubA = subscribeSession('S1', () => {})
    subscribeSession('S2', () => {})
    const client = FakePusher.instances[0]

    unsubA(); unsubA(); unsubA()
    expect(client.disconnected).toBe(false)
  })
})

describe('an id that has not loaded yet', () => {
  it('leaks no connection reference', async () => {
    const { subscribeSession } = await load()
    // An effect that runs before the route param resolves.
    for (let i = 0; i < 5; i++) subscribeSession('', () => {})()

    const unsub = subscribeSession('S1', () => {})
    const client = FakePusher.instances[0]
    unsub()
    // With a leaked reference the count never reaches zero and this stays false.
    expect(client.disconnected, 'the socket must close once nothing holds it').toBe(true)
  })
})

describe('when Pusher is not configured', () => {
  it('opens nothing and returns a usable no-op', async () => {
    delete process.env.NEXT_PUBLIC_PUSHER_KEY
    vi.resetModules()
    const { subscribeSession, realtimeEnabled } = await import('../lib/realtime-client')
    expect(realtimeEnabled()).toBe(false)
    expect(() => subscribeSession('S1', () => {})()).not.toThrow()
    expect(FakePusher.instances.length).toBe(0)
  })
})
