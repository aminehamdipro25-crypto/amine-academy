// Account type decides whether a family is shown prices.
//
// The failure that matters is silent and one-directional: a family the
// specialist treats for free being shown a payment prompt. The default for a
// missing value must therefore be 'online' (the only thing every pre-existing
// account is), while every ambiguous input must not read as online.
import { describe, it, expect } from 'vitest'
import { isInPersonAccount, isPayingAccount } from '../lib/account-type'
import type { Parent } from '../lib/types'

function parent(over: Partial<Parent> = {}): Parent {
  return {
    id: 'AA-1',
    email: 'p@example.com',
    passwordHash: 'x',
    firstName: 'أمين',
    lastName: 'حمدي',
    phone: '',
    country: '',
    subscriptionStatus: 'active',
    subscriptionPlan: 'weekly',
    subscriptionExpiry: null,
    childrenIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: null,
    reminderCount: 0,
    lastReminderAt: null,
    notes: '',
    ...over,
  }
}

describe('isInPersonAccount', () => {
  it('is true only for an explicit in-person account', () => {
    expect(isInPersonAccount(parent({ accountType: 'in-person' }))).toBe(true)
  })

  it('treats an account created before the field existed as online', () => {
    const legacy = parent()
    expect(legacy.accountType).toBeUndefined()
    expect(isInPersonAccount(legacy)).toBe(false)
  })

  it('treats an explicit online account as online', () => {
    expect(isInPersonAccount(parent({ accountType: 'online' }))).toBe(false)
  })

  it('never throws on a missing parent — the portal calls it before data loads', () => {
    expect(isInPersonAccount(null)).toBe(false)
    expect(isInPersonAccount(undefined)).toBe(false)
    expect(isInPersonAccount({})).toBe(false)
  })

  it('does not treat an unrecognised value as in-person', () => {
    // A garbled value must fall back to the paying path, never silently
    // suppress a real client's plan UI.
    expect(isInPersonAccount({ accountType: 'IN-PERSON' as never })).toBe(false)
    expect(isInPersonAccount({ accountType: '' as never })).toBe(false)
  })
})

describe('isPayingAccount', () => {
  it('counts an active online client', () => {
    expect(isPayingAccount(parent({ accountType: 'online', subscriptionStatus: 'active' }))).toBe(true)
  })

  it('counts a legacy account with no accountType', () => {
    expect(isPayingAccount(parent({ subscriptionStatus: 'active' }))).toBe(true)
  })

  it('never counts an in-person family, however active their account is', () => {
    expect(isPayingAccount(parent({ accountType: 'in-person', subscriptionStatus: 'active' }))).toBe(false)
  })

  it('does not count online clients who are not active', () => {
    for (const status of ['pending', 'suspended', 'cancelled', 'expired'] as const) {
      expect(isPayingAccount(parent({ accountType: 'online', subscriptionStatus: status })), status).toBe(false)
    }
  })

  it('splits a mixed roster into disjoint groups that sum correctly', () => {
    const roster = [
      parent({ id: '1', accountType: 'online', subscriptionStatus: 'active' }),
      parent({ id: '2', accountType: 'online', subscriptionStatus: 'pending' }),
      parent({ id: '3', accountType: 'in-person', subscriptionStatus: 'active' }),
      parent({ id: '4', accountType: 'in-person', subscriptionStatus: 'active' }),
      parent({ id: '5', subscriptionStatus: 'active' }), // legacy
    ]
    const inPerson = roster.filter(isInPersonAccount)
    const paying = roster.filter(isPayingAccount)
    expect(inPerson).toHaveLength(2)
    expect(paying).toHaveLength(2)
    // No account may be counted in both — that is exactly the inflation the
    // split exists to prevent.
    expect(inPerson.filter(p => paying.includes(p))).toEqual([])
  })
})
