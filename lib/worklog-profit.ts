// Is the work as profitable as it looks, and where does the profit come from?
// Three pure views over the ledger, recomputed each time so they can never
// disagree with the balances and stats shown elsewhere:
//
//   profitSummary()   — what an hour of work really earns: the price, then
//                       after work expenses, then counting the drive between homes
//   familyProfit()    — the same, family by family, with their cancellations
//   nextMonthOutlook() — next month: what is booked, what the usual pace
//                       gives, and what is left after fixed costs and the budget
//
// Honest limits, said where the numbers are shown: the drive is estimated
// from the homes' pins (straight line × 1.4 at 35 km/h + 5 min, the same
// estimate as the agenda), and only between two homes — the owner's own home
// is not in the ledger, so the first drive of the day is not counted.

import {
  EXPENSE_META, addDays, dayLegs, endOfMonth, isBillable, lessonValue, round2, startOfWeek,
  type GeoPoint, type RecurringExpense, type WorkClient, type WorkExpense, type WorkLesson,
} from './worklog'

const inRange = (d: string, from: string, to: string) => d >= from && d <= to
const perHour = (amount: number, minutes: number) => (minutes > 0 ? round2(amount / (minutes / 60)) : null)

/** Drive minutes into each lesson from the one before it the same day (done lessons only; wrong pins left out). */
function driveIntoLesson(lessons: WorkLesson[], from: string, to: string, locate: (id: string) => GeoPoint | undefined): Map<string, number> {
  const done = lessons.filter(l => l.status === 'done' && inRange(l.date, from, to))
  const out = new Map<string, number>()
  for (const date of new Set(done.map(l => l.date))) {
    for (const leg of dayLegs(done, date, locate)) {
      if (!leg.implausible) out.set(leg.toId, (out.get(leg.toId) ?? 0) + leg.needMin)
    }
  }
  return out
}

export interface ProfitSummary {
  /** Value of the work of the period: done lessons and charged cancellations. */
  earned: number
  minutesDone: number
  /** Estimated drive between homes on the days of done lessons. */
  travelMin: number
  /** Expenses of the «للعمل» group in the period, fixed monthly ones included (internet, ads…). */
  workExpenses: number
  /** earned − work expenses. */
  profit: number
  /** The price as charged: earned ÷ hours taught. */
  hourlyGross: number | null
  /** After work expenses: profit ÷ hours taught. */
  hourlyAfterExpenses: number | null
  /** The real one: profit ÷ (hours taught + hours driving). */
  hourlyReal: number | null
}

export function profitSummary(
  lessons: WorkLesson[], expenses: WorkExpense[], clients: WorkClient[], from: string, to: string,
): ProfitSummary {
  const byId = new Map(clients.map(c => [c.id, c]))
  const inPeriod = lessons.filter(l => inRange(l.date, from, to))
  const earned = round2(inPeriod.reduce((s, l) => s + lessonValue(l), 0))
  const minutesDone = inPeriod.filter(l => l.status === 'done').reduce((s, l) => s + l.durationMin, 0)
  const travelMin = [...driveIntoLesson(lessons, from, to, id => byId.get(id)?.location).values()].reduce((s, m) => s + m, 0)
  const workExpenses = round2(expenses.filter(e => inRange(e.date, from, to) && EXPENSE_META[e.category]?.group === 'work').reduce((s, e) => s + e.amount, 0))
  const profit = round2(earned - workExpenses)
  return {
    earned, minutesDone, travelMin, workExpenses, profit,
    hourlyGross: perHour(earned, minutesDone),
    hourlyAfterExpenses: perHour(profit, minutesDone),
    hourlyReal: perHour(profit, minutesDone + travelMin),
  }
}

export interface FamilyProfit {
  clientId: string
  lessonsDone: number
  minutes: number
  /** Drive into this family's lessons from the previous home that day. */
  travelMin: number
  earned: number
  /** earned ÷ hours taught for this family. */
  hourly: number | null
  /** earned ÷ (hours taught + hours driving to them). */
  hourlyReal: number | null
  cancelled: number
  /** Cancelled ÷ (done + cancelled); null when nothing has been decided. */
  cancelRate: number | null
  /** Price of cancellations that were not charged. */
  lost: number
}

/** Every family with work in the period, best real hourly first; families with no hours last. */
export function familyProfit(lessons: WorkLesson[], clients: WorkClient[], from: string, to: string): FamilyProfit[] {
  const byId = new Map(clients.map(c => [c.id, c]))
  const drive = driveIntoLesson(lessons, from, to, id => byId.get(id)?.location)
  const inPeriod = lessons.filter(l => inRange(l.date, from, to))
  const ids = [...new Set(inPeriod.filter(l => l.status !== 'scheduled').map(l => l.clientId))]
  return ids.map(clientId => {
    const ls = inPeriod.filter(l => l.clientId === clientId)
    const done = ls.filter(l => l.status === 'done')
    const cancelled = ls.filter(l => l.status === 'cancelled')
    const minutes = done.reduce((s, l) => s + l.durationMin, 0)
    const travelMin = done.reduce((s, l) => s + (drive.get(l.id) ?? 0), 0)
    const earned = round2(ls.filter(isBillable).reduce((s, l) => s + l.price, 0))
    const decided = done.length + cancelled.length
    return {
      clientId, lessonsDone: done.length, minutes, travelMin, earned,
      hourly: perHour(earned, minutes),
      hourlyReal: perHour(earned, minutes + travelMin),
      cancelled: cancelled.length,
      cancelRate: decided ? cancelled.length / decided : null,
      lost: round2(cancelled.filter(l => !l.charged).reduce((s, l) => s + l.price, 0)),
    }
  }).sort((a, b) => (b.hourlyReal ?? -1) - (a.hourlyReal ?? -1) || b.earned - a.earned)
}

/** A family that cancels this often (with at least this many decided lessons) is flagged. */
export const HIGH_CANCEL_RATE = 0.25
export const HIGH_CANCEL_MIN_DECIDED = 4

export interface NextMonthOutlook {
  /** First day of the month looked at. */
  month: string
  /** Lessons already in the agenda for that month (scheduled). */
  booked: number
  bookedValue: number
  /** Average earned per week over the last four full weeks, spread over that month. null without any history. */
  paceValue: number | null
  weeklyPace: number | null
  /** Fixed monthly expenses that will be written that month. */
  fixed: number
  /** The monthly budget for day-to-day spending, if one is set. */
  budget: number | null
  /** What each scenario leaves after fixed costs and the budget. */
  leftIfBooked: number
  leftAtPace: number | null
}

/**
 * Next month, before it starts. Two scenarios, because neither alone is true:
 * the agenda only holds what was already booked (usually less than will
 * happen), and the pace assumes the coming weeks look like the last four.
 */
export function nextMonthOutlook(
  lessons: WorkLesson[], recurring: RecurringExpense[], budget: number | null, today: string,
): NextMonthOutlook {
  const month = addDays(endOfMonth(today), 1)
  const to = endOfMonth(month)
  const booked = lessons.filter(l => l.status === 'scheduled' && inRange(l.date, month, to))
  const bookedValue = round2(booked.reduce((s, l) => s + l.price, 0))

  // The last four complete weeks (Monday–Sunday) before this one.
  const paceTo = addDays(startOfWeek(today), -1), paceFrom = addDays(startOfWeek(today), -28)
  const hadAny = lessons.some(l => l.status !== 'scheduled' && l.date <= paceTo)
  const weeklyPace = hadAny
    ? round2(lessons.filter(l => inRange(l.date, paceFrom, paceTo)).reduce((s, l) => s + lessonValue(l), 0) / 4)
    : null
  const days = Number(to.slice(8))
  const paceValue = weeklyPace === null ? null : round2((weeklyPace * days) / 7)

  const ym = month.slice(0, 7)
  const fixed = round2(recurring.filter(r => !r.paused && r.since <= ym).reduce((s, r) => s + r.amount, 0))
  const spend = fixed + (budget ?? 0)
  return {
    month, booked: booked.length, bookedValue, paceValue, weeklyPace, fixed, budget,
    leftIfBooked: round2(bookedValue - spend),
    leftAtPace: paceValue === null ? null : round2(paceValue - spend),
  }
}

