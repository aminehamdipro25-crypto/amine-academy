// Monday-based week buckets, computed entirely in UTC.
//
// Why this exists: the weekly parent email asked for "this week" by taking the
// LAST entry of a list that only contains weeks the child actually played. For
// a child who stopped three weeks ago that last entry is three weeks old — and
// the email printed it under the label "لعبة هذا الأسبوع", every Sunday,
// forever. The number was real; the week it was attributed to was not.
//
// A bucket can only be asked for by key now, so an absent week reads as zero
// instead of silently resolving to the most recent one that had data.
//
// Everything here is UTC. The previous implementation mixed local getDay()/
// setDate() with a UTC toISOString(), so outside UTC the "Monday" key could
// land on a Sunday — the same class of off-by-one already fixed in lib/format.
// Vercel runs in UTC, so this was invisible in production and wrong locally.

/** Midnight UTC on the Monday of the week containing `d`. */
function mondayUtc(d: Date): Date {
  const back = (d.getUTCDay() + 6) % 7 // Monday -> 0 … Sunday -> 6
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  m.setUTCDate(m.getUTCDate() - back)
  return m
}

/** `YYYY-MM-DD` of that week's Monday, or null when the value is not a date. */
export function weekKeyOf(value: string | number | Date): string | null {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return mondayUtc(d).toISOString().slice(0, 10)
}

/** The key for the week we are in right now. */
export function currentWeekKey(now: Date = new Date()): string {
  return mondayUtc(now).toISOString().slice(0, 10)
}

/** Move a week key by whole weeks — `-1` is the week before it. */
export function shiftWeekKey(key: string, weeks: number): string {
  const d = new Date(`${key}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return key
  d.setUTCDate(d.getUTCDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}
