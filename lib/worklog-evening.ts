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
  EVENING_CHECK_DEFAULT, endOfMonth, endTime, formatMoney, lessonWho, lessonsCount, minutesOf, round2, sortLessons, startOfMonth,
  type ExpenseBudget, type WorkClient, type WorkCurrency, type WorkExpense, type WorkLesson,
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
      : `بقي من ميزانية الشهر ${money(b.left)} من ${money(b.amount)}${b.perDayLeft !== null ? ` (≈ ${money(b.perDayLeft)} لليوم)` : ''}`)
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
}

/** A day-to-day expense the budget counts: one of its categories, never a fixed monthly one. */
export function countsForBudget(e: Pick<WorkExpense, 'category' | 'recurringId'>, b: ExpenseBudget): boolean {
  return !e.recurringId && b.categories.includes(e.category)
}

/** Below this share of the budget the bar is calm; from it on, a warning; above the budget, over. */
export const BUDGET_NEAR = 0.8
export const BUDGET_PACE_FROM_DAY = 7

export function budgetStatus(expenses: WorkExpense[], b: ExpenseBudget, monthDate: string, today: string): BudgetStatus {
  const from = startOfMonth(monthDate), to = endOfMonth(monthDate)
  const counted = expenses.filter(e => e.date >= from && e.date <= to && countsForBudget(e, b))
  const spent = round2(counted.reduce((s, e) => s + e.amount, 0))
  const left = round2(b.amount - spent)
  const daysInMonth = Number(to.slice(8))
  const current = today >= from && today <= to
  const elapsed = current ? Number(today.slice(8)) : today > to ? daysInMonth : 0
  const daysLeft = current ? daysInMonth - elapsed + 1 : today < from ? daysInMonth : 0
  return {
    amount: b.amount,
    spent,
    left,
    pct: b.amount ? Math.round((spent / b.amount) * 100) : 0,
    state: spent > b.amount ? 'over' : spent >= b.amount * BUDGET_NEAR ? 'near' : 'ok',
    daysLeft,
    perDayLeft: daysLeft > 0 && left > 0 ? round2(left / daysLeft) : null,
    projected: current && elapsed >= BUDGET_PACE_FROM_DAY ? round2((spent / elapsed) * daysInMonth) : null,
    today: current ? round2(counted.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0)) : 0,
  }
}
