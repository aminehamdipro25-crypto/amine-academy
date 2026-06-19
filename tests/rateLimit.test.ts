import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/redis', () => ({
  redis: {
    isConfigured: vi.fn(),
    pipeline: vi.fn(),
  },
}))

import { redis } from '../lib/redis'
import { isRateLimited } from '../lib/rateLimit'

describe('isRateLimited', () => {
  beforeEach(() => {
    vi.mocked(redis.isConfigured).mockReset()
    vi.mocked(redis.pipeline).mockReset()
  })

  it('reports unavailable (not a real rate limit) when Redis is not configured', async () => {
    vi.mocked(redis.isConfigured).mockReturnValue(false)
    const result = await isRateLimited('k', 5, 60)
    expect(result).toEqual({ limited: true, unavailable: true })
  })

  it('reports unavailable when the Redis pipeline throws', async () => {
    vi.mocked(redis.isConfigured).mockReturnValue(true)
    vi.mocked(redis.pipeline).mockRejectedValue(new Error('network error'))
    const result = await isRateLimited('k', 5, 60)
    expect(result).toEqual({ limited: true, unavailable: true })
  })

  it('reports a genuine rate limit (not unavailable) once count exceeds max', async () => {
    vi.mocked(redis.isConfigured).mockReturnValue(true)
    vi.mocked(redis.pipeline).mockResolvedValue([{ result: 0 }, { result: 6 }])
    const result = await isRateLimited('k', 5, 60)
    expect(result).toEqual({ limited: true, unavailable: false })
  })

  it('allows the request when count is within the limit', async () => {
    vi.mocked(redis.isConfigured).mockReturnValue(true)
    vi.mocked(redis.pipeline).mockResolvedValue([{ result: 0 }, { result: 3 }])
    const result = await isRateLimited('k', 5, 60)
    expect(result).toEqual({ limited: false, unavailable: false })
  })
})
