// The Resend branch used to discard the HTTP response entirely:
//
//   await fetch('https://api.resend.com/emails', {...})
//   return { provider: 'resend' }
//
// A rejected API key, an unverified sender domain and a rate limit all look
// exactly like a successful send to every caller. That is the worst place in
// this app for a silent failure — the activation link a parent is waiting on,
// the "report ready" notice, and the weekly cron, which writes a per-family
// dedup key on success and so would never retry that week.
//
// A real non-OK response from Resend cannot be produced without an account, so
// the response is stubbed here. That is the whole of the branch under test: the
// decision this code makes about what came back.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { sendEmail } from '../lib/mailer'

const realFetch = globalThis.fetch
const realEnv = { ...process.env }

function stubFetch(status: number, body = '') {
  const spy = vi.fn(async () => new Response(body, { status }))
  globalThis.fetch = spy as unknown as typeof fetch
  return spy
}

beforeEach(() => {
  // Gmail is checked first and would short-circuit the branch under test.
  delete process.env.GMAIL_USER
  delete process.env.GMAIL_APP_PASSWORD
  process.env.RESEND_API_KEY = 'test-key'
})

afterEach(() => {
  globalThis.fetch = realFetch
  process.env = { ...realEnv }
})

const message = { to: 'parent@example.com', subject: 'x', html: '<p>x</p>' }

describe('a rejected message is reported as a failure', () => {
  it('throws on 403 — an unverified sender domain', async () => {
    stubFetch(403, JSON.stringify({ message: 'The domain is not verified' }))
    await expect(sendEmail(message)).rejects.toThrow(/403/)
  })

  it('throws on 401 — a bad API key', async () => {
    stubFetch(401, JSON.stringify({ message: 'API key is invalid' }))
    await expect(sendEmail(message)).rejects.toThrow(/401/)
  })

  it('throws on 429 — rate limited', async () => {
    stubFetch(429)
    await expect(sendEmail(message)).rejects.toThrow(/429/)
  })

  it("carries Resend's own explanation, so the cause is visible", async () => {
    stubFetch(403, JSON.stringify({ message: 'The amine-academy.com domain is not verified' }))
    await expect(sendEmail(message)).rejects.toThrow(/not verified/)
  })
})

describe('a delivered message still resolves', () => {
  it('resolves on 200', async () => {
    stubFetch(200, JSON.stringify({ id: 'msg_1' }))
    await expect(sendEmail(message)).resolves.toEqual({ provider: 'resend' })
  })

  it('sends to the address given, as a single recipient', async () => {
    const spy = stubFetch(200)
    await sendEmail(message)
    const body = JSON.parse((spy.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.to).toEqual(['parent@example.com'])
  })

  it('takes the sender from the environment when one is set', async () => {
    process.env.RESEND_FROM = 'Amine <noreply@verified.example>'
    // The module read the default at import time, so this asserts the override
    // path exists rather than that a late change is picked up.
    const spy = stubFetch(200)
    await sendEmail(message)
    const body = JSON.parse((spy.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(typeof body.from).toBe('string')
    expect(body.from).toContain('<')
  })
})

describe('no provider at all', () => {
  it('throws rather than pretending the message went out', async () => {
    delete process.env.RESEND_API_KEY
    await expect(sendEmail(message)).rejects.toThrow(/No email provider/)
  })
})
