import { describe, it, expect } from 'vitest'
import { recoveryKey, RECOVERY_TTL_SECONDS } from '../lib/admin-recovery'

describe('admin recovery token key', () => {
  it('never stores the raw token in the key', () => {
    const token = 'super-secret-token-value'
    const key = recoveryKey(token)
    expect(key.startsWith('admin_recovery:')).toBe(true)
    expect(key).not.toContain(token)
  })

  it('is deterministic for the same token', () => {
    expect(recoveryKey('abc')).toBe(recoveryKey('abc'))
  })

  it('differs for different tokens', () => {
    expect(recoveryKey('abc')).not.toBe(recoveryKey('abd'))
  })

  it('is a sha256 hex digest (64 chars) so it cannot be reversed', () => {
    const hash = recoveryKey('abc').split(':')[1]
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('expires quickly — a stale link must not stay usable', () => {
    expect(RECOVERY_TTL_SECONDS).toBeLessThanOrEqual(15 * 60)
  })
})
