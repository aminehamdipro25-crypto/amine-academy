import { describe, it, expect } from 'vitest'
import { safeRedirectPath } from '../lib/safe-redirect'

describe('safeRedirectPath', () => {
  it('allows a normal same-origin path', () => {
    expect(safeRedirectPath('/session/abc123/kid', '/parent/dashboard')).toBe('/session/abc123/kid')
  })

  it('falls back when null or empty', () => {
    expect(safeRedirectPath(null, '/parent/dashboard')).toBe('/parent/dashboard')
    expect(safeRedirectPath('', '/parent/dashboard')).toBe('/parent/dashboard')
  })

  it('rejects absolute external URLs', () => {
    expect(safeRedirectPath('https://evil.example/phish', '/parent/dashboard')).toBe('/parent/dashboard')
    expect(safeRedirectPath('http://evil.example', '/parent/dashboard')).toBe('/parent/dashboard')
  })

  it('rejects protocol-relative URLs', () => {
    expect(safeRedirectPath('//evil.example/phish', '/parent/dashboard')).toBe('/parent/dashboard')
  })

  it('rejects backslash tricks', () => {
    expect(safeRedirectPath('/\\evil.example', '/parent/dashboard')).toBe('/parent/dashboard')
  })

  it('rejects paths without a leading slash', () => {
    expect(safeRedirectPath('evil.example', '/parent/dashboard')).toBe('/parent/dashboard')
  })

  it('rejects embedded scheme even mid-string', () => {
    expect(safeRedirectPath('/redirect-to?u=https://evil.example', '/parent/dashboard')).toBe('/parent/dashboard')
  })
})
