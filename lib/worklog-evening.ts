// Two end-of-day aids, kept pure so they can be tested:
//
//   unmarkedLessons() / eveningMessage() — the evening check: lessons that are
//     over but still «مجدولة». They count for nothing — not in income, not in
//     what a family owes — until marked, which is the commonest way the
//     ledger's numbers drift from the truth.
//   budgetStatus() — the monthly ceiling for day-to-day expenses: spent, left,
//     left per remaining day, and where the current pace ends the month.

import { ARABIC_LOCALE, formatDateOnly } from './format'
import {
  EVENING_CHECK_DEFAULT, EXPENSE_LABEL, endOfMonth, endTime, formatMoney, lessonWho, lessonsCount, minutesOf, round2, sortLessons, startOfMonth,
  type ExpenseBudget, type ExpenseCategory, type WorkClient, type WorkCurrency, type WorkExpense, type WorkLesson,
} from './worklog'

// ── Evening check ────────────────────────────────────────────────────────────

/** Lessons that are over and still «مجدولة»: today's that have ended, and any from earlier days. */
export function unmarkedLessons(lessons: WorkLesson[], today: string, nowMin: number): { today: WorkLesson[]; earlier: WorkLesson[] } {
  const open = lessons.filter(l => l.status === 'scheduled')
  return {
    today: sortLessons(open.filter(l => l.date === today && minutesOf(l.start) + l.durationMin <= nowMin)),
    earlier: sortLessons(open.filter(l => l.date < today)),
  }
}

/** Whether the evening check should run now: on, and its hour reached (until midnight). */
export function eveningDue(at: string | null | undefined, nowMin: number): boolean {
  if (at === null) return false
  return nowMin >= minutesOf(at ?? EVENING_CHECK_DEFAULT)
}

export interface EveningInput {
  unmarked: { today: WorkLesson[]; earlier: WorkLesson[] }
  clients: WorkClient[]
  currency: WorkCurrency
  link: string
  /** Day-to-day spending, for one line under the lessons. */
  spentToday: number
  budget?: BudgetStatus | null
}

const tgEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const day = (d: string) => formatDateOnly(d, ARABIC_LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })

/** The message, or null when every lesson that is over has a status — then nothing is sent. */
export function eveningMessage(o: EveningInput): { subject: string; telegram: string; html: string } | null {
  const { today, earlier } = o.unmarked
  const n = today.length + earlier.length
  if (!n) return null
  const byId = new Map(o.clients.map(c => [c.id, c]))
  const money = (v: number) => formatMoney(v, o.currency)
  const value = round2([...today, ...earlier].reduce((s, l) => s + l.price, 0))
  const line = (l: WorkLesson, withDay: boolean) =>
    `${withDay ? `${day(l.date)} · ` : ''}${l.start}–${endTime(l.start, l.durationMin)} ${lessonWho(l, byId.get(l.clientId))} · ${money(l.price)}`

  const lines: string[] = []
  if (today.length) {
    lines.push(`حصص اليوم التي لم تُحدَّد بعد (${today.length}):`)
    lines.push(...today.map(l => `• ${line(l, false)}`))
  }
  if (earlier.length) {
    lines.push(today.length ? `وأيضاً من أيام سابقة (${earlier.length}):` : `حصص من أيام سابقة لم تُحدَّد بعد (${earlier.length}):`)
    // The oldest are the likeliest forgotten; past ten, a count is enough.
    lines.push(...earlier.slice(0, 10).map(l => `• ${line(l, true)}`))
    if (earlier.length > 10) lines.push(`• و${lessonsCount(earlier.length - 10)} أخرى`)
  }
  const why = `${lessonsCount(n)} بقيمة ${money(value)} لا تدخل الدخل ولا المستحقات حتى تضغط «تمّت» أو «ألغيت».`
  const spend = spendLine(o.spentToday, o.budget, money)

  const title = `حصص بلا حالة بعد: ${lessonsCount(n)}`
  const subject = `🌙 ${title}`
  const telegram = [
    `🌙 <b>${tgEsc(title)}</b>`,
    ...lines.map(tgEsc),
    '',
    tgEsc(why),
    spend ? `\n💸 ${tgEsc(spend)}` : '',
    `\n<a href="${o.link}">فتح اليومية وتحديدها</a>`,
  ].filter(x => x !== '').join('\n')
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
<h2 style="margin:0 0 12px">${tgEsc(title)}</h2>
${lines.map(l => `<p style="margin:2px 0">${tgEsc(l)}</p>`).join('')}
<p style="color:#b45309;margin-top:12px">${tgEsc(why)}</p>
${spend ? `<p>${tgEsc(spend)}</p>` : ''}
<p><a href="${o.link}">فتح اليومية وتحديدها</a></p></div>`
  return { subject, telegram, html }
}

function spendLine(spentToday: number, b: BudgetStatus | null | undefined, money: (v: number) => string): string {
  const parts: string[] = []
  if (spentToday > 0) parts.push(`صرفت اليوم ${money(spentToday)}`)
  if (b) {
    parts.push(b.state === 'over'
      ? `تجاوزت ميزانية الشهر بـ${money(-b.left)} (${money(b.spent)} من ${money(b.amount)})`
      : `بقي من ميزانية الشهر ${money(b.left)} من ${money(b.amount)}${b.fromTomorrow !== null ? ` — ${money(b.fromTomorrow)} لكل يوم من الغد` : ''}`)
  }
  return parts.join(' · ')
}

// ── Monthly budget ───────────────────────────────────────────────────────────

export interface BudgetStatus {
  amount: number
  spent: number
  /** Negative once over. */
  left: number
  /** 0–100+, for the bar. */
  pct: number
  state: 'ok' | 'near' | 'over'
  /** Days still to come in the month, today included; 0 for a past month. */
  daysLeft: number
  /** What is left spread over those days; null when nothing is left or no day remains. */
  perDayLeft: number | null
  /** Where the month ends at the pace so far — only from the 7th day, before that one big day decides it. */
  projected: number | null
  /** Spent today in the budget's categories (0 outside the current month). */
  today: number
  /**
   * Today's fair share: what was left this morning (before today's spending)
   * split evenly over the days left, today included. null outside the current month.
   */
  todayShare: number | null
  /** That share minus what was spent today — negative once today's share is used up. */
  todayLeft: number | null
  /** What is left now, split over the days after today; null on the month's last day or outside it. */
  fromTomorrow: number | null
}

/** A day-to-day expense the budget counts: one of its categories, never a fixed monthly one. */
export function countsForBudget(e: Pick<WorkExpense, 'category' | 'recurringId'>, b: ExpenseBudget): boolean {
  return !e.recurringId && b.categories.includes(e.category)
}

/** Below this share of the budget the bar is calm; from it on, a warning; above the budget, over. */
export const BUDGET_NEAR = 0.8
export const BUDGET_PACE_FROM_DAY = 7

/** The month's days around `today`: how many have passed (today included) and how many remain (today included). */
function monthDays(monthDate: string, today: string) {
  const from = startOfMonth(monthDate), to = endOfMonth(monthDate)
  const daysInMonth = Number(to.slice(8))
  const current = today >= from && today <= to
  const elapsed = current ? Number(today.slice(8)) : today > to ? daysInMonth : 0
  const daysLeft = current ? daysInMonth - elapsed + 1 : today < from ? daysInMonth : 0
  return { from, to, daysInMonth, current, elapsed, daysLeft }
}

/** Today's share of a ceiling, measured from this morning, and what is left of it. */
function dailyShare(amount: number, spent: number, spentToday: number, daysLeft: number, current: boolean) {
  const todayShare = current ? round2(Math.max(0, amount - (spent - spentToday)) / daysLeft) : null
  return { todayShare, todayLeft: todayShare === null ? null : round2(todayShare - spentToday) }
}

export interface CategoryBudget {
  category: ExpenseCategory
  limit: number
  spent: number
  /** Negative once over. */
  left: number
  pct: number
  state: 'ok' | 'near' | 'over'
  /** Spent today in this category. */
  today: number
  todayShare: number | null
  todayLeft: number | null
  /** Whether the category is also counted in the total budget. */
  inTotal: boolean
}

/**
 * Each category that has its own ceiling, the most pressing first (highest
 * share used). Same rules as the total: fixed monthly expenses never count,
 * and today's share is measured from this morning.
 */
export function categoryBudgets(expenses: WorkExpense[], b: ExpenseBudget, monthDate: string, today: string): CategoryBudget[] {
  const { from, to, current, daysLeft } = monthDays(monthDate, today)
  return (Object.entries(b.limits ?? {}) as [ExpenseCategory, number][])
    .filter(([, limit]) => limit > 0)
    .map(([category, limit]) => {
      const es = expenses.filter(e => e.date >= from && e.date <= to && e.category === category && !e.recurringId)
      const spent = round2(es.reduce((s, e) => s + e.amount, 0))
      const spentToday = current ? round2(es.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0)) : 0
      return {
        category, limit, spent,
        left: round2(limit - spent),
        pct: Math.round((spent / limit) * 100),
        state: spent > limit ? 'over' : spent >= limit * BUDGET_NEAR ? 'near' : 'ok',
        today: spentToday,
        ...dailyShare(limit, spent, spentToday, daysLeft, current),
        inTotal: b.categories.includes(category),
      } as CategoryBudget
    })
    .sort((a, c) => c.pct - a.pct)
}

/**
 * Ceilings of categories inside the total that add up to more than the total —
 * then the total runs out before the categories do, and one of the two is wrong.
 */
export function limitsExceedTotal(b: ExpenseBudget): number | null {
  const sum = round2(b.categories.reduce((s, c) => s + (b.limits?.[c] ?? 0), 0))
  return sum > b.amount ? sum : null
}

/** The morning message's budget lines: today's share, and the categories close to or over their ceiling. */
export function budgetDigestLines(st: BudgetStatus, cats: CategoryBudget[], currency: WorkCurrency): string[] {
  const money = (v: number) => formatMoney(v, currency)
  const lines: string[] = []
  if (st.state === 'over') lines.push(`💸 تجاوزت ميزانية الشهر بـ${money(-st.left)} — كل ما تصرفه حتى نهاية الشهر يزيد التجاوز`)
  else if (st.todayShare !== null) lines.push(`💸 يمكنك أن تصرف اليوم ${money(st.todayShare)} (بقي من ميزانية الشهر ${money(st.left)} من ${money(st.amount)})`)
  for (const c of cats.filter(x => x.state !== 'ok')) {
    lines.push(c.state === 'over'
      ? `• ${EXPENSE_LABEL[c.category]}: تجاوزت سقفها بـ${money(-c.left)}`
      : `• ${EXPENSE_LABEL[c.category]}: بقي ${money(c.left)} من ${money(c.limit)}${c.todayShare !== null ? ` — ${money(c.todayShare)} لليوم` : ''}`)
  }
  return lines
}

export function budgetStatus(expenses: WorkExpense[], b: ExpenseBudget, monthDate: string, today: string): BudgetStatus {
  const { from, to, daysInMonth, current, elapsed, daysLeft } = monthDays(monthDate, today)
  const counted = expenses.filter(e => e.date >= from && e.date <= to && countsForBudget(e, b))
  const spent = round2(counted.reduce((s, e) => s + e.amount, 0))
  const left = round2(b.amount - spent)
  const spentToday = current ? round2(counted.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0)) : 0
  return {
    amount: b.amount,
    spent,
    left,
    pct: b.amount ? Math.round((spent / b.amount) * 100) : 0,
    state: spent > b.amount ? 'over' : spent >= b.amount * BUDGET_NEAR ? 'near' : 'ok',
    daysLeft,
    perDayLeft: daysLeft > 0 && left > 0 ? round2(left / daysLeft) : null,
    projected: current && elapsed >= BUDGET_PACE_FROM_DAY ? round2((spent / elapsed) * daysInMonth) : null,
    today: spentToday,
    // Measured from this morning, so spending today does not shrink today's own share.
    ...dailyShare(b.amount, spent, spentToday, daysLeft, current),
    fromTomorrow: current && daysLeft > 1 ? round2(Math.max(0, left) / (daysLeft - 1)) : null,
  }
}
