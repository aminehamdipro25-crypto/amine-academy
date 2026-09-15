// Reading a family's account type.
//
// Kept in its own module with no data imports: the parent portal's layout,
// dashboard and upgrade page are all client components that need this, and
// pulling lib/db or the full types barrel into those bundles for one comparison
// would be wasteful.
import type { AccountType, Parent } from './types'

/**
 * True when this family is treated face to face and was given portal access by
 * the specialist rather than paying for a plan.
 *
 * Accounts created before `accountType` existed have no value, and every one of
 * those is a self-registered online account — so undefined means 'online'.
 * Always go through this helper so that default is not re-implemented per call
 * site, where one site forgetting it would show a paying family the wrong UI.
 */
export function isInPersonAccount(
  parent: { accountType?: AccountType } | null | undefined,
): boolean {
  return parent?.accountType === 'in-person'
}

/** Accounts that represent paying online clients, for dashboard counts. */
export function isPayingAccount(
  parent: Pick<Parent, 'subscriptionStatus'> & { accountType?: AccountType },
): boolean {
  return !isInPersonAccount(parent) && parent.subscriptionStatus === 'active'
}
