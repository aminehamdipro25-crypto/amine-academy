import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../lib/password'

describe('password hashing', () => {
  it('verifies a correctly hashed password', () => {
    const hash = hashPassword('correct-horse-battery-staple')
    expect(verifyPassword('correct-horse-battery-staple', hash)).toBe(true)
  })

  it('rejects an incorrect password', () => {
    const hash = hashPassword('correct-horse-battery-staple')
    expect(verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('produces a different salt (and hash) on each call', () => {
    const a = hashPassword('same-input')
    const b = hashPassword('same-input')
    expect(a).not.toBe(b)
    expect(verifyPassword('same-input', a)).toBe(true)
    expect(verifyPassword('same-input', b)).toBe(true)
  })

  it('rejects malformed stored hashes', () => {
    expect(verifyPassword('anything', 'not-a-real-hash')).toBe(false)
    expect(verifyPassword('anything', '')).toBe(false)
  })
})
