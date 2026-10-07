// دفتر الحصص الخاصة — the logic of the specialist's private home-lesson ledger.
//
// Everything here is pure (no Redis, no DOM), so the numbers the page shows and
// the numbers the tests check are produced by the same lines.
//
// The model follows how private lessons are actually paid: there is no fixed
// fee and no fixed pay day. A lesson that happened is OWED; a payment is money
// that ARRIVED, whenever the family chose to pay. They are separate records and
// are never tied one-to-one, so the balance of a family is simply
//
//     billable lessons (all time) − payments (all time)
//
// positive = the family owes, negative = the family paid ahead (credit).
//
// Two words are kept apart on purpose everywhere below:
//   earned    — value of lessons delivered in the period (what you WORKED for)
//   collected — payments received in the period (what actually CAME IN)
// A month where many families paid late looks great on "earned" and poor on
// "collected"; showing only one of them hides exactly what this page is for.

import { sanitizePersonName } from './person-name'

export type LessonStatus = 'scheduled' | 'done' | 'cancelled'
export type CancelledBy = 'family' | 'me'
export type PaymentMethod = 'cash' | 'transfer' | 'other'
export type ExpenseCategory = 'transport' | 'materials' | 'phone' | 'food' | 'rent' | 'other'
export type WorkCurrency = 'QAR' | 'TND'

export interface GeoPoint { lat: number; lng: number }

export interface WorkClient {
  id: string
  /** The parent / family name — the person who pays. */
  name: string
  childName?: string
  phone?: string
  address?: string
  location?: GeoPoint
  /** Usual price of ONE HOUR. Prefills new lessons; each lesson keeps its own price. */
  hourlyRate: number
  /** Palette key, so a family keeps the same colour across the agenda and charts. */
  color: string
  notes?: string
  archived?: boolean
  createdAt: string
}

export interface WorkLesson {
  id: string
  clientId: string
  /** Local calendar date, YYYY-MM-DD. */
  date: string
  /** Local wall-clock start, HH:MM. */
  start: string
  durationMin: number
  /** Price of THIS lesson (a snapshot — changing the family's rate never rewrites history). */
  price: number
  status: LessonStatus
  cancelledBy?: CancelledBy
  /** Why it was cancelled («ظرف طارئ») — shown on the card and in the family's statement. */
  cancelReason?: string
  /** A late cancellation the family still pays for. */
  charged?: boolean
  note?: string
  /** Minutes before start to remind; null = no reminder. */
  reminderMin: number | null
  /** Lessons created together as a weekly series share this id. */
  seriesId?: string
  /** The specialist's own 1–5 rating of how the lesson went — a judgement, not a measurement. */
  rating?: number
  /** When the parent was sent a WhatsApp reminder for this lesson (set by the server). */
  parentRemindedAt?: string
  /**
   * Which child this lesson was for, when a family has more than one (a
   * sibling's assessment after the usual lesson). Absent = the family's child.
   */
  child?: string
  createdAt: string
  updatedAt: string
}

export interface WorkPayment {
  id: string
  clientId: string
  date: string
  amount: number
  method: PaymentMethod
  note?: string
  /**
   * Set when the payment was taken at the end of a specific lesson. Purely a
   * trace for the agenda («مدفوعة» on that card) — balances still sum every
   * payment against every billable lesson, so this can never count twice.
   */
  lessonId?: string
  /**
   * A prepaid package: this payment covers the family's next N billable
   * lessons, counted from its date. Money still balances the usual way —
   * this only lets the ledger say "3 of 8 left" and warn before it runs out.
   */
  lessonsCovered?: number
  createdAt: string
}

export interface WorkExpense {
  id: string
  date: string
  amount: number
  category: ExpenseCategory
  note?: string
  /**
   * What the amount is made of — «أوبر 12 · قهوة 8 · مقتنيات 15». When present
   * the amount is their sum, recomputed by the server, so the two cannot differ.
   */
  items?: ExpenseItem[]
  /** Set when the expense was written by a monthly fixed expense (rent…). */
  recurringId?: string
  createdAt: string
}

export interface ExpenseItem { label?: string; amount: number }

/** «أوبر 12 · قهوة 8» — how an itemised expense reads in a list, a sheet or Notion. */
export function expenseItemsText(items: ExpenseItem[] | undefined, currency?: WorkCurrency): string {
  return (items ?? []).map(i => `${i.label ? `${i.label} ` : ''}${currency ? formatMoney(i.amount, currency) : i.amount}`).join(' · ')
}

/**
 * A fixed monthly expense — the rent on the 10th, 2300. Each month, on that
 * day, a real expense record is written (so it counts in every total, the
 * report and the export like any other). `lastMonth` is the last month
 * written; it is kept by the server, so deleting one month's record does not
 * bring it back.
 */
export interface RecurringExpense {
  id: string
  label: string
  category: ExpenseCategory
  amount: number
  /** Day of the month, 1–31; a short month uses its last day. */
  day: number
  /** First month it applies to (YYYY-MM). */
  since: string
  lastMonth?: string
  paused?: boolean
}

export interface WorkSettings {
  currency: WorkCurrency
  /** IANA zone used by the server for "today" (morning digest). */
  timezone: string
  defaultReminderMin: number | null
  defaultDurationMin: number
  /** Secret token of the calendar feed; absent = feed disabled. */
  calendarToken?: string
  dailyDigest: boolean
  /** Monthly income goal (value of work done); null = none set. */
  monthlyGoal?: number | null
  /** How messages to parents are signed, e.g. «الأستاذ أمين». Absent = unsigned. */
  senderName?: string
  /**
   * The owner's Notion database lessons are copied into, and which column gets
   * what. Written only by /api/admin/worklog/notion (it validates the database
   * first); the general settings PUT never touches it.
   */
  notion?: { databaseId: string; map: Partial<Record<string, string>> }
  /** Weekly summary on Sunday morning (Telegram/email). Absent = on. */
  weeklyDigest?: boolean
  /** When home lessons can be booked — used by «متى أنا متاح؟». Absent = AVAILABILITY_DEFAULT. */
  availability?: Availability
  /** Fixed monthly expenses (rent…), written as expenses on their day. */
  recurringExpenses?: RecurringExpense[]
}

/** Working days (Monday = 0 … Sunday = 6) and hours offered to families. */
export interface Availability {
  days: number[]; start: string; end: string
  /** Minimum free minutes after a lesson before the next one at another home — the drive can be long. Absent = 45. */
  gapMin?: number
}
/** Every day but Friday, 08:00–21:00 — the owner narrows it in «أوقات عملي». */
export const AVAILABILITY_DEFAULT: Availability = { days: [0, 1, 2, 3, 5, 6], start: '08:00', end: '21:00', gapMin: 45 }

export const DEFAULT_SETTINGS: WorkSettings = {
  currency: 'QAR',
  timezone: 'Asia/Qatar',
  defaultReminderMin: 60,
  defaultDurationMin: 60,
  dailyDigest: true,
}

// ── Labels & colours ─────────────────────────────────────────────────────────

/** Family colours — fixed order, assigned to new families in turn. */
export const CLIENT_COLORS = [
  '#7C5CFC', '#0EA5E9', '#F97316', '#14B8A6', '#E11D48',
  '#84CC16', '#A855F7', '#F59E0B', '#06B6D4', '#64748B',
] as const

/**
 * Status colours. Green/red alone fails deuteranopia (ΔE 5), so these steps
 * were validated for colour-blind separation — and every status is ALWAYS shown
 * with its icon and word as well, never colour alone.
 */
export const STATUS_META: Record<LessonStatus, { label: string; color: string; soft: string; text: string; icon: string }> = {
  scheduled: { label: 'مجدولة',  color: '#3B82F6', soft: 'bg-blue-50',    text: 'text-blue-700',    icon: '◷' },
  done:      { label: 'تمّت',    color: '#15803D', soft: 'bg-emerald-50', text: 'text-emerald-700', icon: '✓' },
  cancelled: { label: 'ملغاة',   color: '#FB7185', soft: 'bg-rose-50',    text: 'text-rose-700',    icon: '✕' },
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'نقداً', transfer: 'تحويل', other: 'أخرى',
}

export const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  transport: 'تنقّل ووقود', materials: 'أدوات ومواد', phone: 'هاتف وإنترنت', food: 'أكل', rent: 'الكراء', other: 'أخرى',
}

export const CURRENCY_LABEL: Record<WorkCurrency, string> = { QAR: 'ر.ق', TND: 'د.ت' }

// ── Small helpers ────────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** Money is kept to 2 decimals (TND uses millimes, but no one bills a lesson in them). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** A real calendar date — rejects 2026-02-30, which JS would roll into March. */
export function isValidDate(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function isValidTime(s: unknown): s is string {
  return typeof s === 'string' && TIME_RE.test(s)
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayMon0(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

export function startOfWeek(date: string): string {
  return addDays(date, -weekdayMon0(date))
}

export function startOfMonth(date: string): string {
  return date.slice(0, 7) + '-01'
}

export function endOfMonth(date: string): string {
  const [y, m] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function endTime(start: string, durationMin: number): string {
  const t = (minutesOf(start) + durationMin) % (24 * 60)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** "1:30" style duration, or "45 د" under an hour. */
export function formatDuration(min: number): string {
  if (min <= 0) return '0 س'
  if (min < 60) return `${min} د`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}:${String(m).padStart(2, '0')} س` : `${h} س`
}

/** Hours with at most one decimal, never "2.0". */
export function formatHours(min: number): string {
  const h = Math.round((min / 60) * 10) / 10
  return Number.isInteger(h) ? String(h) : h.toFixed(1)
}

/** A span of minutes as people say it: «45 د» · «ساعة» · «4 س 30 د». */
export function durationText(min: number): string {
  const m = Math.max(0, Math.round(min))
  const h = Math.floor(m / 60), r = m % 60
  if (h === 0) return `${r} د`
  const hs = h === 1 ? 'ساعة' : h === 2 ? 'ساعتان' : `${h} س`
  return r === 0 ? hs : `${hs} و${r} د`
}

export function formatMoney(n: number, currency: WorkCurrency): string {
  const v = round2(n)
  // Latin digits by construction (standing rule 8), with a thin grouping comma.
  const [int, frac] = Math.abs(v).toFixed(Number.isInteger(v) ? 0 : 2).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${v < 0 ? '-' : ''}${grouped}${frac ? '.' + frac : ''} ${CURRENCY_LABEL[currency]}`
}

export function priceFor(hourlyRate: number, durationMin: number): number {
  return round2((Math.max(0, hourlyRate) * Math.max(0, durationMin)) / 60)
}

/** "Today" as a calendar date in the given IANA zone (the server runs in UTC). */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  } catch {
    return now.toISOString().slice(0, 10)
  }
}

/**
 * The wall clock in a zone, as a Date whose *local* getters read that wall
 * time — the same convention as lessonStartLocal(), so the two compare
 * directly on a server that runs in UTC (Vercel) while the lessons are in
 * Doha or Tunis.
 */
export function wallClockIn(timeZone: string, now: Date = new Date()): Date {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(now)
    const n = (t: string) => Number(parts.find(p => p.type === t)?.value)
    return new Date(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'))
  } catch {
    return new Date(now)
  }
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false }
}

// ── Money logic ──────────────────────────────────────────────────────────────

/** Whether a lesson is owed: delivered, or cancelled late and still charged. */
export function isBillable(l: Pick<WorkLesson, 'status' | 'charged'>): boolean {
  return l.status === 'done' || (l.status === 'cancelled' && !!l.charged)
}

export function lessonValue(l: Pick<WorkLesson, 'status' | 'charged' | 'price'>): number {
  return isBillable(l) ? l.price : 0
}

export interface ClientBalance {
  clientId: string
  billed: number
  paid: number
  /** billed − paid. Positive = owes, negative = credit. */
  balance: number
  lastPaymentDate: string | null
  /** Billable lessons delivered after the last payment (what the next payment usually covers). */
  lessonsSinceLastPayment: number
  /** Past lessons still marked "scheduled" — they may be missing from the balance. */
  unconfirmed: number
}

export function clientBalances(
  clients: WorkClient[],
  lessons: WorkLesson[],
  payments: WorkPayment[],
  today: string,
): ClientBalance[] {
  return clients.map(c => {
    const ls = lessons.filter(l => l.clientId === c.id)
    const ps = payments.filter(p => p.clientId === c.id)
    const billed = round2(ls.reduce((s, l) => s + lessonValue(l), 0))
    const paid = round2(ps.reduce((s, p) => s + p.amount, 0))
    const lastPaymentDate = ps.length ? ps.map(p => p.date).sort().at(-1)! : null
    return {
      clientId: c.id,
      billed,
      paid,
      balance: round2(billed - paid),
      lastPaymentDate,
      lessonsSinceLastPayment: ls.filter(l => isBillable(l) && (!lastPaymentDate || l.date > lastPaymentDate)).length,
      unconfirmed: ls.filter(l => l.status === 'scheduled' && l.date < today).length,
    }
  })
}

// ── Period statistics ────────────────────────────────────────────────────────

export interface PeriodStats {
  from: string
  to: string
  lessonsDone: number
  lessonsCancelled: number
  lessonsScheduled: number
  minutesDone: number
  minutesCancelled: number
  minutesScheduled: number
  /** Value of delivered (and charged-cancelled) lessons in the period. */
  earned: number
  /** Value of the lessons lost to non-charged cancellations. */
  lostToCancellations: number
  /** Value still ahead: scheduled lessons in the period. */
  expected: number
  collected: number
  expenses: number
  /** collected − expenses: the money that actually stays with you. */
  net: number
  /** null when no lesson happened or was cancelled — 0% would be a claim. */
  cancellationRate: number | null
  /** null with no hours done. */
  avgHourly: number | null
  cancelledByFamily: number
  cancelledByMe: number
  byClient: { clientId: string; lessons: number; minutes: number; earned: number; collected: number; cancelled: number }[]
  byExpenseCategory: { category: ExpenseCategory; amount: number }[]
  byWeekday: { weekday: number; minutes: number }[]
}

const inRange = (d: string, from: string, to: string) => d >= from && d <= to

export function periodStats(
  lessons: WorkLesson[],
  payments: WorkPayment[],
  expenses: WorkExpense[],
  from: string,
  to: string,
): PeriodStats {
  const ls = lessons.filter(l => inRange(l.date, from, to))
  const ps = payments.filter(p => inRange(p.date, from, to))
  const es = expenses.filter(e => inRange(e.date, from, to))

  const done = ls.filter(l => l.status === 'done')
  const cancelled = ls.filter(l => l.status === 'cancelled')
  const scheduled = ls.filter(l => l.status === 'scheduled')
  const sumMin = (xs: WorkLesson[]) => xs.reduce((s, l) => s + l.durationMin, 0)
  const sumAmount = (xs: { amount: number }[]) => round2(xs.reduce((s, x) => s + x.amount, 0))

  const earned = round2(ls.reduce((s, l) => s + lessonValue(l), 0))
  const minutesDone = sumMin(done)
  const collected = sumAmount(ps)
  const expenseTotal = sumAmount(es)
  const decided = done.length + cancelled.length

  const clientIds = [...new Set([...ls.map(l => l.clientId), ...ps.map(p => p.clientId)])]
  const byClient = clientIds.map(id => {
    const cl = ls.filter(l => l.clientId === id)
    const cd = cl.filter(l => l.status === 'done')
    return {
      clientId: id,
      lessons: cd.length,
      minutes: sumMin(cd),
      earned: round2(cl.reduce((s, l) => s + lessonValue(l), 0)),
      collected: sumAmount(ps.filter(p => p.clientId === id)),
      cancelled: cl.filter(l => l.status === 'cancelled').length,
    }
  }).sort((a, b) => b.earned - a.earned || b.collected - a.collected)

  const cats = [...new Set(es.map(e => e.category))]
  const byExpenseCategory = cats
    .map(category => ({ category, amount: sumAmount(es.filter(e => e.category === category)) }))
    .sort((a, b) => b.amount - a.amount)

  const byWeekday = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    minutes: sumMin(done.filter(l => weekdayMon0(l.date) === weekday)),
  }))

  return {
    from, to,
    lessonsDone: done.length,
    lessonsCancelled: cancelled.length,
    lessonsScheduled: scheduled.length,
    minutesDone,
    minutesCancelled: sumMin(cancelled),
    minutesScheduled: sumMin(scheduled),
    earned,
    lostToCancellations: round2(cancelled.filter(l => !l.charged).reduce((s, l) => s + l.price, 0)),
    expected: round2(scheduled.reduce((s, l) => s + l.price, 0)),
    collected,
    expenses: expenseTotal,
    net: round2(collected - expenseTotal),
    cancellationRate: decided ? cancelled.length / decided : null,
    avgHourly: minutesDone ? round2(done.reduce((s, l) => s + l.price, 0) / (minutesDone / 60)) : null,
    cancelledByFamily: cancelled.filter(l => l.cancelledBy !== 'me').length,
    cancelledByMe: cancelled.filter(l => l.cancelledBy === 'me').length,
    byClient,
    byExpenseCategory,
    byWeekday,
  }
}

/** Hours done / cancelled per Monday-week, every week present (a quiet week is a zero, not a gap). */
export function weeklyHours(lessons: WorkLesson[], from: string, to: string) {
  const out: { week: string; done: number; cancelled: number; scheduled: number }[] = []
  for (let w = startOfWeek(from); w <= to; w = addDays(w, 7)) {
    const end = addDays(w, 6)
    const ls = lessons.filter(l => l.date >= w && l.date <= end && l.date >= from && l.date <= to)
    const h = (s: LessonStatus) => Math.round(ls.filter(l => l.status === s).reduce((a, l) => a + l.durationMin, 0) / 6) / 10
    out.push({ week: w, done: h('done'), cancelled: h('cancelled'), scheduled: h('scheduled') })
  }
  return out
}

/** Earned / collected / expenses per calendar month, every month present. */
export function monthlyMoney(
  lessons: WorkLesson[], payments: WorkPayment[], expenses: WorkExpense[], from: string, to: string,
) {
  const out: { month: string; earned: number; collected: number; expenses: number; net: number }[] = []
  for (let m = startOfMonth(from); m <= to; m = addDays(endOfMonth(m), 1)) {
    const s = periodStats(lessons, payments, expenses, m, endOfMonth(m))
    out.push({ month: m.slice(0, 7), earned: s.earned, collected: s.collected, expenses: s.expenses, net: s.net })
  }
  return out
}

// ── Scheduling ───────────────────────────────────────────────────────────────

/** Dates of a weekly series: the first date plus `count − 1` more, a week apart. */
export function weeklySeries(firstDate: string, count: number): string[] {
  const n = Math.min(52, Math.max(1, Math.floor(count)))
  return Array.from({ length: n }, (_, i) => addDays(firstDate, i * 7))
}

/**
 * The dates a weekly repeat should create. A week where this family already
 * has a lesson overlapping that time is skipped, not doubled: repeating
 * «Hamad, Wednesday 15:30» over weeks the agenda already holds must extend the
 * series, not book the same hour twice. Cancelled lessons don't hold the slot.
 */
export function seriesPlan(
  existing: WorkLesson[],
  candidate: Pick<WorkLesson, 'clientId' | 'date' | 'start' | 'durationMin'>,
  count: number,
): { dates: string[]; skipped: string[] } {
  const dates: string[] = [], skipped: string[] = []
  const s = minutesOf(candidate.start), e = s + candidate.durationMin
  for (const date of weeklySeries(candidate.date, count)) {
    const taken = existing.some(l => l.clientId === candidate.clientId && l.date === date && l.status !== 'cancelled'
      && minutesOf(l.start) < e && s < minutesOf(l.start) + l.durationMin)
    ;(taken ? skipped : dates).push(date)
  }
  return { dates, skipped }
}

/** Lessons that overlap `candidate` on the same day (cancelled ones free the slot). */
export function findConflicts(
  candidate: Pick<WorkLesson, 'date' | 'start' | 'durationMin'> & { id?: string },
  lessons: WorkLesson[],
): WorkLesson[] {
  const a0 = minutesOf(candidate.start)
  const a1 = a0 + candidate.durationMin
  return lessons.filter(l => {
    if (l.id === candidate.id || l.date !== candidate.date || l.status === 'cancelled') return false
    const b0 = minutesOf(l.start)
    return a0 < b0 + l.durationMin && b0 < a1
  })
}

export function sortLessons(ls: WorkLesson[]): WorkLesson[] {
  return [...ls].sort((a, b) => (a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date)))
}

/** Local Date of a lesson's start, in the zone of whoever is running this code. */
export function lessonStartLocal(l: Pick<WorkLesson, 'date' | 'start'>): Date {
  const [y, m, d] = l.date.split('-').map(Number)
  const [hh, mm] = l.start.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

/**
 * Reminders that are due now: scheduled, reminder set, the reminder moment has
 * passed and the lesson has not started yet. Already-sent ids are skipped, so
 * a page reload never repeats a notification.
 */
export function dueReminders(lessons: WorkLesson[], now: Date, alreadySent: Set<string>): WorkLesson[] {
  const t = now.getTime()
  return lessons.filter(l => {
    if (l.status !== 'scheduled' || l.reminderMin === null || alreadySent.has(l.id)) return false
    const start = lessonStartLocal(l).getTime()
    return t >= start - l.reminderMin * 60_000 && t < start
  })
}

// ── Maps ─────────────────────────────────────────────────────────────────────

export function isValidPoint(p: unknown): p is GeoPoint {
  if (!p || typeof p !== 'object') return false
  const { lat, lng } = p as GeoPoint
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
}

function point(lat: string, lng: string): GeoPoint | null {
  const p = { lat: Math.round(Number(lat) * 1e6) / 1e6, lng: Math.round(Number(lng) * 1e6) / 1e6 }
  return isValidPoint(p) ? p : null
}

/**
 * Coordinates out of whatever the user pasted: plain "25.28, 51.52", or a
 * Google Maps / Waze / Apple / OSM link. Short links (maps.app.goo.gl) carry no
 * coordinates — those are resolved on the server first.
 */
export function parseMapLink(input: string): GeoPoint | null {
  if (!input) return null
  let s = input.trim()
  try { s = decodeURIComponent(s) } catch { /* keep as is */ }
  const num = '(-?\\d{1,3}(?:\\.\\d+)?)'
  const patterns = [
    // Place pages put the real pin in !3d<lat>!4d<lng>; the @ part is only the viewport.
    new RegExp(`!3d${num}!4d${num}`),
    new RegExp(`[?&](?:q|query|ll|destination|daddr|center|sll)=(?:loc:)?${num}\\s*,\\s*${num}`),
    new RegExp(`[?&]mlat=${num}&mlon=${num}`),
    new RegExp(`@${num},${num}`),
    new RegExp(`#map=\\d+/${num}/${num}`),
    new RegExp(`^${num}\\s*[, ]\\s*${num}$`),
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m) { const p = point(m[1], m[2]); if (p) return p }
  }
  return null
}

/** Hosts whose short links the server may follow to find coordinates. */
export const MAP_LINK_HOSTS = ['maps.app.goo.gl', 'goo.gl', 'g.co', 'www.google.com', 'google.com', 'maps.google.com', 'consent.google.com']

export function isAllowedMapHost(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && MAP_LINK_HOSTS.includes(u.hostname)
  } catch { return false }
}

export function googleDirectionsUrl(p: GeoPoint): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`
}

export function wazeUrl(p: GeoPoint): string {
  return `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`
}

/** A Google Maps route through several stops, in order (max 9 waypoints + destination). */
export function googleRouteUrl(points: GeoPoint[]): string | null {
  if (!points.length) return null
  const stops = points.slice(0, 10)
  const dest = stops[stops.length - 1]
  const way = stops.slice(0, -1).map(p => `${p.lat},${p.lng}`).join('|')
  return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}${way ? `&waypoints=${encodeURIComponent(way)}` : ''}`
}

/** Straight-line distance in km — enough to warn about two lessons too far apart. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export interface GeocodeHit { label: string; point: GeoPoint }

/**
 * Nominatim (OpenStreetMap search) results → a short list of places. Anything
 * malformed is dropped rather than trusted: these coordinates become a
 * family's saved address and the place the specialist drives to.
 */
export function parseGeocodeResults(json: unknown, max = 5): GeocodeHit[] {
  if (!Array.isArray(json)) return []
  const out: GeocodeHit[] = []
  for (const r of json) {
    if (!r || typeof r !== 'object') continue
    const { lat, lon, display_name } = r as { lat?: unknown; lon?: unknown; display_name?: unknown }
    const p = { lat: Math.round(Number(lat) * 1e6) / 1e6, lng: Math.round(Number(lon) * 1e6) / 1e6 }
    if (!isValidPoint(p) || typeof display_name !== 'string') continue
    out.push({ label: display_name.slice(0, 200), point: p })
    if (out.length >= max) break
  }
  return out
}

/** wa.me wants digits only; a local Qatari / Tunisian number gets its country code. */
export function phoneDigits(phone: string | undefined, currency: WorkCurrency): string | null {
  if (!phone) return null
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (!d) return null
  if (currency === 'QAR' && d.length === 8) d = '974' + d
  if (currency === 'TND' && d.length === 8) d = '216' + d
  return d.length >= 8 ? d : null
}

// ── Calendar feed (iCalendar, RFC 5545) ──────────────────────────────────────

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1')
}

/** Lines over 75 octets are folded — a long address must not break the feed. */
function icsFold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const out: string[] = []
  let cur = ''
  let curLen = 0
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length
    const limit = out.length ? 74 : 75
    if (curLen + n > limit) { out.push(cur); cur = ''; curLen = 0 }
    cur += ch
    curLen += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

/** Minutes the zone is ahead of UTC at this instant (Doha: +180). */
function zoneOffsetMin(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(at)
  const n = (t: string) => Number(parts.find(p => p.type === t)?.value)
  return (Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second')) - at.getTime()) / 60000
}

/**
 * A wall-clock time in the ledger's zone as an absolute UTC instant. Two
 * passes, so a lesson on a daylight-saving changeover day lands right too.
 */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const wall = Date.UTC(y, mo - 1, d, h, mi)
  let t = wall - zoneOffsetMin(timeZone, new Date(wall)) * 60000
  t = wall - zoneOffsetMin(timeZone, new Date(t)) * 60000
  return new Date(t)
}

const icsUtc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/**
 * The lessons as a calendar the phone subscribes to.
 *
 * Times are absolute UTC instants («…Z»), converted from the ledger's zone.
 * They used to be «floating» local times, which iPhone reads as local but
 * Google Calendar reads as UTC — so a 10:00 lesson in Doha showed at 13:00.
 */
export function buildIcs(lessons: WorkLesson[], clients: WorkClient[], timeZone: string, now: Date = new Date()): string {
  const byId = new Map(clients.map(c => [c.id, c]))
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Amine Academy//Work Log//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:حصصي الخاصة',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ]
  for (const l of sortLessons(lessons)) {
    const c = byId.get(l.clientId)
    const who = lessonWho(l, c, ' — ')
    const desc = [
      c?.phone ? `الهاتف: ${c.phone}` : '',
      c?.location ? `الطريق: ${googleDirectionsUrl(c.location)}` : '',
      l.note ? `ملاحظة: ${l.note}` : '',
    ].filter(Boolean).join('\n')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${l.id}@amine-academy-worklog`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsUtc(zonedToUtc(l.date, l.start, timeZone))}`,
      `DURATION:PT${l.durationMin}M`,
      `SUMMARY:${icsEscape((l.status === 'cancelled' ? '✕ ملغاة — ' : '') + 'حصة: ' + who)}`,
      `STATUS:${l.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    )
    if (c?.address || c?.location) {
      lines.push(`LOCATION:${icsEscape(c.address || `${c.location!.lat},${c.location!.lng}`)}`)
    }
    if (c?.location) lines.push(`GEO:${c.location.lat};${c.location.lng}`)
    if (desc) lines.push(`DESCRIPTION:${icsEscape(desc)}`)
    if (l.status === 'scheduled' && l.reminderMin !== null) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${icsEscape('تذكير: حصة ' + who)}`,
        `TRIGGER:-PT${l.reminderMin}M`,
        'END:VALARM',
      )
    }
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(icsFold).join('\r\n') + '\r\n'
}

// ── Input sanitising (every body that reaches the store passes through here) ──

function cleanText(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined
  // No control or bidi-override characters: these notes reach the calendar feed and Telegram.
  // eslint-disable-next-line no-control-regex
  const s = v.replace(/[\u0000-\u0009\u000B-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, '').trim().slice(0, max)
  return s || undefined
}

function cleanAmount(v: unknown, max = 1_000_000): number | null {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v)
  if (!Number.isFinite(n) || n < 0 || n > max) return null
  return round2(n)
}

function cleanReminder(v: unknown): number | null | undefined {
  if (v === null || v === '' || v === 'none') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || n > 7 * 24 * 60) return undefined
  return Math.round(n)
}

export type Clean<T> = { ok: true; value: T } | { ok: false; error: string }

export function sanitizeClient(body: Record<string, unknown>, partial = false): Clean<Partial<WorkClient>> {
  const out: Partial<WorkClient> = {}
  if (!partial || 'name' in body) {
    const name = sanitizePersonName(body.name)
    if (!name) return { ok: false, error: 'اسم العائلة مطلوب' }
    out.name = name
  }
  if ('childName' in body) out.childName = sanitizePersonName(body.childName) || undefined
  if ('phone' in body) {
    const p = cleanText(body.phone, 30)
    if (p && !/^[+\d\s()-]{6,30}$/.test(p)) return { ok: false, error: 'رقم الهاتف غير صالح' }
    out.phone = p
  }
  if ('address' in body) out.address = cleanText(body.address, 200)
  if ('notes' in body) out.notes = cleanText(body.notes, 1000)
  if ('location' in body) {
    if (body.location === null || body.location === '') out.location = undefined
    else if (isValidPoint(body.location)) {
      const p = body.location as GeoPoint
      out.location = { lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 }
    } else return { ok: false, error: 'الموقع غير صالح' }
  }
  if (!partial || 'hourlyRate' in body) {
    const r = cleanAmount(body.hourlyRate ?? 0, 100_000)
    if (r === null) return { ok: false, error: 'سعر الساعة غير صالح' }
    out.hourlyRate = r
  }
  if ('color' in body) {
    out.color = (CLIENT_COLORS as readonly string[]).includes(String(body.color)) ? String(body.color) : CLIENT_COLORS[0]
  }
  if ('archived' in body) out.archived = !!body.archived
  return { ok: true, value: out }
}

export function sanitizeLesson(body: Record<string, unknown>, partial = false): Clean<Partial<WorkLesson>> {
  const out: Partial<WorkLesson> = {}
  if (!partial || 'clientId' in body) {
    const id = cleanText(body.clientId, 80)
    if (!id) return { ok: false, error: 'اختر العائلة' }
    out.clientId = id
  }
  if (!partial || 'date' in body) {
    if (!isValidDate(body.date)) return { ok: false, error: 'التاريخ غير صالح' }
    out.date = body.date
  }
  if (!partial || 'start' in body) {
    if (!isValidTime(body.start)) return { ok: false, error: 'وقت البداية غير صالح' }
    out.start = body.start
  }
  if (!partial || 'durationMin' in body) {
    const d = Number(body.durationMin)
    if (!Number.isFinite(d) || d < 5 || d > 12 * 60) return { ok: false, error: 'مدة الحصة غير صالحة (5 دقائق إلى 12 ساعة)' }
    out.durationMin = Math.round(d)
  }
  if (!partial || 'price' in body) {
    const p = cleanAmount(body.price ?? 0, 100_000)
    if (p === null) return { ok: false, error: 'سعر الحصة غير صالح' }
    out.price = p
  }
  if (!partial || 'status' in body) {
    const s = String(body.status ?? 'scheduled')
    if (!['scheduled', 'done', 'cancelled'].includes(s)) return { ok: false, error: 'حالة غير معروفة' }
    out.status = s as LessonStatus
  }
  if ('cancelReason' in body) out.cancelReason = cleanText(body.cancelReason, 120) || undefined
  if ('cancelledBy' in body) out.cancelledBy = body.cancelledBy === 'me' ? 'me' : body.cancelledBy === 'family' ? 'family' : undefined
  if ('charged' in body) out.charged = !!body.charged
  if ('note' in body) out.note = cleanText(body.note, 500)
  if ('child' in body) out.child = sanitizePersonName(body.child) || undefined
  if ('rating' in body) {
    if (body.rating === null || body.rating === '' || body.rating === 0) out.rating = undefined
    else {
      const r = Number(body.rating)
      if (!Number.isInteger(r) || r < 1 || r > 5) return { ok: false, error: 'التقييم من 1 إلى 5' }
      out.rating = r
    }
  }
  // The timestamp is the server's, never the browser's: it records when the reminder was sent.
  if ('parentReminded' in body) out.parentRemindedAt = body.parentReminded ? new Date().toISOString() : undefined
  if (!partial || 'reminderMin' in body) {
    const r = cleanReminder(body.reminderMin ?? null)
    if (r === undefined) return { ok: false, error: 'وقت التذكير غير صالح' }
    out.reminderMin = r
  }
  // Only a cancelled lesson carries cancellation details.
  if (out.status && out.status !== 'cancelled') { out.cancelledBy = undefined; out.charged = false; out.cancelReason = undefined }
  return { ok: true, value: out }
}

export function sanitizePayment(body: Record<string, unknown>): Clean<Omit<WorkPayment, 'id' | 'createdAt'>> {
  const clientId = cleanText(body.clientId, 80)
  if (!clientId) return { ok: false, error: 'اختر العائلة' }
  if (!isValidDate(body.date)) return { ok: false, error: 'التاريخ غير صالح' }
  const amount = cleanAmount(body.amount)
  if (amount === null || amount === 0) return { ok: false, error: 'المبلغ غير صالح' }
  const method = (['cash', 'transfer', 'other'] as const).includes(body.method as PaymentMethod) ? body.method as PaymentMethod : 'cash'
  let lessonsCovered: number | undefined
  if (body.lessonsCovered !== undefined && body.lessonsCovered !== null && body.lessonsCovered !== '' && body.lessonsCovered !== 0) {
    const n = Number(body.lessonsCovered)
    if (!Number.isInteger(n) || n < 1 || n > 200) return { ok: false, error: 'عدد حصص الباقة غير صالح (1 إلى 200)' }
    lessonsCovered = n
  }
  return { ok: true, value: { clientId, date: body.date, amount, method, note: cleanText(body.note, 300), lessonId: cleanText(body.lessonId, 80), lessonsCovered } }
}

export function sanitizeExpense(body: Record<string, unknown>): Clean<Omit<WorkExpense, 'id' | 'createdAt'>> {
  if (!isValidDate(body.date)) return { ok: false, error: 'التاريخ غير صالح' }
  const category = (Object.keys(EXPENSE_LABEL) as ExpenseCategory[]).includes(body.category as ExpenseCategory)
    ? body.category as ExpenseCategory : 'other'
  // Items, when sent, decide the amount: the client's total is never trusted over its parts.
  let items: ExpenseItem[] | undefined
  if (Array.isArray(body.items) && body.items.length) {
    if (body.items.length > 40) return { ok: false, error: 'عدد البنود كبير جداً' }
    items = []
    for (const raw of body.items as Record<string, unknown>[]) {
      const amount = cleanAmount(raw?.amount)
      if (amount === null || amount === 0) return { ok: false, error: 'مبلغ أحد البنود غير صالح' }
      const label = cleanText(raw?.label, 40)
      items.push(label ? { label, amount } : { amount })
    }
  }
  const amount = items ? round2(items.reduce((s, i) => s + i.amount, 0)) : cleanAmount(body.amount)
  if (amount === null || amount === 0) return { ok: false, error: 'المبلغ غير صالح' }
  // A single unnamed part is just an amount; the key is still written so an edit can clear old items.
  const keep = items && (items.length > 1 || items[0].label) ? items : undefined
  return { ok: true, value: { date: body.date, amount, category, note: cleanText(body.note, 300), items: keep } }
}

export function sanitizeSettings(body: Record<string, unknown>, current: WorkSettings): Clean<WorkSettings> {
  const next = { ...current }
  if ('currency' in body) next.currency = body.currency === 'TND' ? 'TND' : 'QAR'
  if ('timezone' in body) {
    if (!isValidTimeZone(body.timezone)) return { ok: false, error: 'المنطقة الزمنية غير صالحة' }
    next.timezone = body.timezone
  }
  if ('defaultReminderMin' in body) {
    const r = cleanReminder(body.defaultReminderMin)
    if (r === undefined) return { ok: false, error: 'وقت التذكير غير صالح' }
    next.defaultReminderMin = r
  }
  if ('defaultDurationMin' in body) {
    const d = Number(body.defaultDurationMin)
    if (!Number.isFinite(d) || d < 5 || d > 12 * 60) return { ok: false, error: 'المدة غير صالحة' }
    next.defaultDurationMin = Math.round(d)
  }
  if ('dailyDigest' in body) next.dailyDigest = !!body.dailyDigest
  if ('monthlyGoal' in body) {
    if (body.monthlyGoal === null || body.monthlyGoal === '' || body.monthlyGoal === 0) next.monthlyGoal = null
    else {
      const g = cleanAmount(body.monthlyGoal, 10_000_000)
      if (g === null) return { ok: false, error: 'الهدف الشهري غير صالح' }
      next.monthlyGoal = g
    }
  }
  if ('weeklyDigest' in body) next.weeklyDigest = !!body.weeklyDigest
  if ('availability' in body) {
    const a = body.availability as Partial<Availability> | null
    const days = Array.isArray(a?.days) ? [...new Set(a!.days.map(Number))].filter(d => Number.isInteger(d) && d >= 0 && d <= 6).sort() : []
    if (!a || !days.length || !isValidTime(a.start) || !isValidTime(a.end) || minutesOf(a.start) >= minutesOf(a.end)) {
      return { ok: false, error: 'أوقات الإتاحة غير صالحة' }
    }
    const gap = a.gapMin === undefined || a.gapMin === null ? AVAILABILITY_DEFAULT.gapMin! : Number(a.gapMin)
    if (!Number.isInteger(gap) || gap < 0 || gap > 180) return { ok: false, error: 'الفاصل بين الحصص غير صالح' }
    next.availability = { days, start: a.start, end: a.end, gapMin: gap }
  }
  if ('recurringExpenses' in body) {
    if (!Array.isArray(body.recurringExpenses) || body.recurringExpenses.length > 20) return { ok: false, error: 'المصاريف الثابتة غير صالحة' }
    const prev = new Map((current.recurringExpenses ?? []).map(r => [r.id, r]))
    const out: RecurringExpense[] = []
    for (const raw of body.recurringExpenses as Record<string, unknown>[]) {
      const label = cleanText(raw?.label, 60)
      const amount = cleanAmount(raw?.amount)
      const day = Number(raw?.day)
      const since = typeof raw?.since === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw.since) ? raw.since : null
      if (!label || !amount || !Number.isInteger(day) || day < 1 || day > 31 || !since) {
        return { ok: false, error: 'أكمل بيانات المصروف الثابت: الاسم والمبلغ واليوم' }
      }
      const category = (Object.keys(EXPENSE_LABEL) as ExpenseCategory[]).includes(raw.category as ExpenseCategory) ? raw.category as ExpenseCategory : 'other'
      const id = typeof raw.id === 'string' && /^rec_[\w-]{4,40}$/.test(raw.id) ? raw.id : `rec_${Math.random().toString(36).slice(2, 10)}`
      // lastMonth is the server's bookkeeping: never taken from the request.
      const old = prev.get(id)
      out.push({ id, label, category, amount, day, since, ...(old?.lastMonth ? { lastMonth: old.lastMonth } : {}), ...(raw.paused ? { paused: true } : {}) })
    }
    next.recurringExpenses = out
  }
  if ('senderName' in body) {
    const v = sanitizePersonName(body.senderName)
    if (v) next.senderName = v
    else delete next.senderName
  }
  return { ok: true, value: next }
}

// ── Travel between homes ─────────────────────────────────────────────────────

/**
 * A deliberately cautious drive-time estimate. Straight-line distance × 1.4
 * approximates the road distance in a city grid; 35 km/h is a realistic
 * door-to-door average in Doha or Tunis traffic; 5 minutes covers parking and
 * the walk to the door. It is a warning threshold, not a routing engine — so
 * it errs towards "this is tight" rather than promising a gap that is not there.
 */
export const ROAD_FACTOR = 1.4
export const CITY_KMH = 35
export const DOOR_BUFFER_MIN = 5
/**
 * Two homes this far apart (road estimate) cannot both be on one day's round
 * of home lessons — one of the pins is wrong (a pasted link of another city,
 * a mis-picked search result). Saying "you need 26778 minutes" would be a
 * number nobody can act on; saying "check this pin" is.
 */
export const MAX_PLAUSIBLE_KM = 150

export function travelMinutes(a: GeoPoint, b: GeoPoint): number {
  const km = distanceKm(a, b) * ROAD_FACTOR
  return Math.round((km / CITY_KMH) * 60) + DOOR_BUFFER_MIN
}

export interface TravelLeg {
  fromId: string
  toId: string
  /** Estimated road distance. */
  km: number
  needMin: number
  /** Free minutes between the end of the first lesson and the start of the next. */
  gapMin: number
  tight: boolean
  /** The distance is too large to be real: a location needs fixing, not a faster drive. */
  implausible: boolean
}

type Locate = (clientId: string) => GeoPoint | undefined

function leg(a: Pick<WorkLesson, 'id' | 'clientId' | 'start' | 'durationMin'>, b: Pick<WorkLesson, 'id' | 'clientId' | 'start'>, locate: Locate): TravelLeg | null {
  // The same family twice in a row needs no drive.
  if (a.clientId === b.clientId) return null
  const pa = locate(a.clientId), pb = locate(b.clientId)
  if (!pa || !pb) return null
  const needMin = travelMinutes(pa, pb)
  const gapMin = minutesOf(b.start) - (minutesOf(a.start) + a.durationMin)
  const km = Math.round(distanceKm(pa, pb) * ROAD_FACTOR * 10) / 10
  const implausible = km > MAX_PLAUSIBLE_KM
  return { fromId: a.id, toId: b.id, km, needMin, gapMin, tight: !implausible && gapMin < needMin, implausible }
}

/** Every drive of one day, between consecutive non-cancelled lessons at different homes. */
export function dayLegs(lessons: WorkLesson[], date: string, locate: Locate): TravelLeg[] {
  const day = sortLessons(lessons.filter(l => l.date === date && l.status !== 'cancelled'))
  const out: TravelLeg[] = []
  const wrongPins = new Set<string>()
  for (let i = 1; i < day.length; i++) {
    const l = leg(day[i - 1], day[i], locate)
    if (!l) continue
    if (l.implausible) {
      // A wrong pin shows up on every drive to and from that home — say it once a day.
      const pair = [day[i - 1].clientId, day[i].clientId].sort().join('|')
      if (wrongPins.has(pair)) continue
      wrongPins.add(pair)
    }
    out.push(l)
  }
  return out
}

/**
 * The drives a lesson being scheduled would create: from the lesson that ends
 * just before it, and to the one that starts just after it. Only tight ones
 * (and impossible distances — a wrong pin) are returned: those are the warnings.
 */
export function travelWarnings(
  candidate: Pick<WorkLesson, 'date' | 'start' | 'durationMin' | 'clientId'> & { id?: string },
  lessons: WorkLesson[],
  locate: Locate,
): (TravelLeg & { otherId: string; direction: 'from' | 'to' })[] {
  const c = { ...candidate, id: candidate.id ?? '__candidate' }
  const start = minutesOf(c.start), end = start + c.durationMin
  const same = lessons.filter(l => l.date === c.date && l.status !== 'cancelled' && l.id !== c.id)
  const before = same.filter(l => minutesOf(l.start) + l.durationMin <= start)
    .sort((a, b) => (minutesOf(b.start) + b.durationMin) - (minutesOf(a.start) + a.durationMin))[0]
  const after = same.filter(l => minutesOf(l.start) >= end).sort((a, b) => minutesOf(a.start) - minutesOf(b.start))[0]
  const out: (TravelLeg & { otherId: string; direction: 'from' | 'to' })[] = []
  if (before) { const l = leg(before, c, locate); if (l?.tight || l?.implausible) out.push({ ...l, otherId: before.id, direction: 'from' }) }
  if (after) { const l = leg(c, after, locate); if (l?.tight || l?.implausible) out.push({ ...l, otherId: after.id, direction: 'to' }) }
  return out
}

// ── Hours at a glance ────────────────────────────────────────────────────────

export interface HoursSummary { done: number; scheduled: number; cancelled: number }

/** Minutes done / still scheduled / cancelled in a date range. */
export function hoursIn(lessons: WorkLesson[], from: string, to: string): HoursSummary {
  const out = { done: 0, scheduled: 0, cancelled: 0 }
  for (const l of lessons) {
    if (l.date < from || l.date > to) continue
    out[l.status === 'done' ? 'done' : l.status === 'cancelled' ? 'cancelled' : 'scheduled'] += l.durationMin
  }
  return out
}

// ── Account statement for a family (sent on WhatsApp) ───────────────────────

/** Arabic counted noun: حصة واحدة · حصتان · 3 حصص · 11 حصة. */
export function lessonsCount(n: number): string {
  if (n === 0) return 'لا حصص'
  if (n === 1) return 'حصة واحدة'
  if (n === 2) return 'حصتان'
  if (n % 100 >= 3 && n % 100 <= 10) return `${n} حصص`
  return `${n} حصة`
}

export interface Statement {
  from: string
  to: string
  lessons: WorkLesson[]
  payments: WorkPayment[]
  /** Billable value of the period's lessons. */
  billed: number
  billedMinutes: number
  billedCount: number
  paidInPeriod: number
  /** All-time: what is still owed today (negative = paid ahead). */
  balance: number
  /** Past lessons in the period with no status yet — not in the totals. */
  unconfirmed: number
}

export function buildStatement(
  clientId: string, lessons: WorkLesson[], payments: WorkPayment[], from: string, to: string, today: string,
): Statement {
  const own = lessons.filter(l => l.clientId === clientId)
  const ownPay = payments.filter(p => p.clientId === clientId)
  const inPeriod = sortLessons(own.filter(l => l.date >= from && l.date <= to && l.status !== 'scheduled'))
  const billable = inPeriod.filter(isBillable)
  const paid = ownPay.filter(p => p.date >= from && p.date <= to).sort((a, b) => a.date.localeCompare(b.date))
  const allBilled = own.reduce((s, l) => s + lessonValue(l), 0)
  const allPaid = ownPay.reduce((s, p) => s + p.amount, 0)
  return {
    from, to,
    lessons: inPeriod,
    payments: paid,
    billed: round2(billable.reduce((s, l) => s + l.price, 0)),
    billedMinutes: billable.reduce((s, l) => s + l.durationMin, 0),
    billedCount: billable.length,
    paidInPeriod: round2(paid.reduce((s, p) => s + p.amount, 0)),
    balance: round2(allBilled - allPaid),
    unconfirmed: own.filter(l => l.status === 'scheduled' && l.date >= from && l.date <= to && l.date < today).length,
  }
}

// ── Which child a lesson was for ─────────────────────────────────────────────

/** The child a lesson was for: its own, else the family's. */
export function lessonChild(l: Pick<WorkLesson, 'child'>, c: Pick<WorkClient, 'childName'> | undefined): string {
  return l.child?.trim() || c?.childName?.trim() || ''
}

/** «سيف (أم سيف)» — child and family, for calendar entries and notifications. */
export function lessonWho(l: Pick<WorkLesson, 'child'>, c: Pick<WorkClient, 'name' | 'childName'> | undefined, sep = ' — '): string {
  if (!c) return 'حصة'
  const child = lessonChild(l, c)
  return child ? `${child}${sep}${c.name}` : c.name
}

/** Every child this family's lessons have been for — the family's own first. */
export function familyChildren(clientId: string, client: Pick<WorkClient, 'childName'> | undefined, lessons: WorkLesson[]): string[] {
  const out: string[] = []
  const add = (n: string | undefined) => { const v = n?.trim(); if (v && !out.includes(v)) out.push(v) }
  add(client?.childName)
  for (const l of [...lessons].sort((a, b) => (a.date < b.date ? 1 : -1))) if (l.clientId === clientId) add(l.child)
  return out
}

// ── Messages to parents ──────────────────────────────────────────────────────

/**
 * Every message to a parent opens and closes the same way. These go to
 * families from the teacher's own WhatsApp, so the register is formal: the
 * full greeting, and the plural «أوقاتكم / لكم» — the respectful form, which
 * also needs no guess at the reader's gender.
 */
export function parentOpening(client: Pick<WorkClient, 'name'>): string[] {
  const name = client.name?.trim()
  return ['السلام عليكم ورحمة الله وبركاته،', `أسعد الله أوقاتكم${name ? ` ${name}` : ''}،`, '']
}

export function parentClosing(thanks: string, sender?: string): string[] {
  const who = sender?.trim()
  return ['', thanks, ...(who ? [who] : [])]
}

/**
 * The message itself. Written for a parent, not an accountant: one line per
 * lesson, then three numbers. "المتبقي حتى اليوم" is the all-time balance on
 * purpose — a period total alone would hide an older unpaid month.
 */
export function statementText(
  st: Statement, client: Pick<WorkClient, 'name' | 'childName'>, currency: WorkCurrency,
  formatDay: (date: string) => string, sender?: string,
): string {
  const money = (n: number) => formatMoney(n, currency)
  const lines: string[] = parentOpening(client)
  const kids = [...new Set(st.lessons.map(l => lessonChild(l, client)).filter(Boolean))]
  const whom = kids.length > 1 ? kids.join(' و') : kids[0] ?? client.childName ?? ''
  lines.push(`نرفق لكم كشف حصص${whom ? ` ${whom}` : ''} للفترة من ${formatDay(st.from)} إلى ${formatDay(st.to)}:`)
  lines.push('')
  if (!st.lessons.length) lines.push('لا حصص في هذه الفترة.')
  // With two children in the period, each line says whose lesson it was.
  const several = new Set(st.lessons.map(l => lessonChild(l, client))).size > 1
  for (const l of st.lessons) {
    const tag = l.status === 'done' ? '✓' : l.charged ? '✕ ملغاة (محتسبة)' : '✕ ملغاة (غير محتسبة)'
    const price = isBillable(l) ? ` — ${money(l.price)}` : ''
    const whose = several && lessonChild(l, client) ? ` — ${lessonChild(l, client)}` : ''
    const why = l.status === 'cancelled' && l.cancelReason ? ` — ${l.cancelReason}` : ''
    lines.push(`• ${formatDay(l.date)} ${l.start}${whose} — ${formatDuration(l.durationMin)}${price} ${tag}${why}`)
  }
  lines.push('')
  lines.push(`مجموع الحصص المحتسبة: ${lessonsCount(st.billedCount)} · ${formatDuration(st.billedMinutes)} · ${money(st.billed)}`)
  if (st.payments.length) {
    lines.push(`المبالغ المستلمة في الفترة: ${money(st.paidInPeriod)}`)
    // One per line: a day label may itself contain «،», so a joined list reads ambiguously.
    for (const p of st.payments) lines.push(`  - ${formatDay(p.date)}: ${money(p.amount)}`)
  }
  if (st.balance > 0) {
    lines.push(`المتبقي حتى اليوم: ${money(st.balance)}`)
    lines.push('نرجو التكرّم بتسويته في الوقت الذي يناسبكم.')
  } else if (st.balance < 0) lines.push(`رصيد مدفوع مسبقاً لديكم: ${money(-st.balance)}`)
  else lines.push('الحساب مسدّد بالكامل حتى اليوم.')
  lines.push(...parentClosing('مع خالص الشكر والتقدير 🌷', sender))
  return lines.join('\n')
}

// ── 1. Editing a weekly series ───────────────────────────────────────────────

/** What a series edit may carry forward. Status, payment and notes stay per lesson. */
export type SeriesPatch = Partial<Pick<WorkLesson, 'date' | 'start' | 'durationMin' | 'price' | 'reminderMin'>>

/**
 * "This lesson and every scheduled one after it". A changed date moves every
 * lesson by the same number of days, so the weekly rhythm is kept (Sunday →
 * Monday moves all the Sundays). Lessons already done or cancelled are never
 * touched: they are history.
 */
export function seriesEditTargets(lessons: WorkLesson[], anchor: WorkLesson, patch: SeriesPatch): WorkLesson[] {
  if (!anchor.seriesId) return []
  const shift = patch.date && isValidDate(patch.date) && isValidDate(anchor.date)
    ? Math.round((Date.parse(patch.date) - Date.parse(anchor.date)) / 864e5) : 0
  return lessons
    .filter(l => l.seriesId === anchor.seriesId && l.date >= anchor.date && (l.id === anchor.id || l.status === 'scheduled'))
    .map(l => {
      const { date: _d, ...rest } = patch
      return { ...l, ...rest, date: shift ? addDays(l.date, shift) : l.date }
    })
}

// ── 2. Prepaid packages ──────────────────────────────────────────────────────

export interface PackageStatus {
  paymentId: string
  startDate: string
  covered: number
  used: number
  /** Negative = lessons beyond the package, owed separately. */
  remaining: number
  amount: number
}

/** The family's current package: its latest payment with lessonsCovered, consumed by billable lessons from its date. */
export function packageStatus(clientId: string, lessons: WorkLesson[], payments: WorkPayment[]): PackageStatus | null {
  const pkg = payments
    .filter(p => p.clientId === clientId && p.lessonsCovered)
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))
    .at(-1)
  if (!pkg) return null
  const used = lessons.filter(l => l.clientId === clientId && l.date >= pkg.date && isBillable(l)).length
  return { paymentId: pkg.id, startDate: pkg.date, covered: pkg.lessonsCovered!, used, remaining: pkg.lessonsCovered! - used, amount: pkg.amount }
}

/** Running low: one lesson or fewer left, or already past the end. */
export function packageNeedsRenewal(p: PackageStatus | null): boolean {
  return !!p && p.remaining <= 1
}

export function renewalText(client: Pick<WorkClient, 'name' | 'childName'>, p: PackageStatus, sender?: string): string {
  const pkg = `باقة ${client.childName ? `حصص ${client.childName}` : 'الحصص'} (${lessonsCount(p.covered)})`
  const news = p.remaining > 0
    ? `نحيطكم علماً بأنه بقيت ${lessonsCount(p.remaining)} من ${pkg}.`
    : p.remaining === 0
      ? `نحيطكم علماً بانتهاء ${pkg}.`
      : `نحيطكم علماً بانتهاء ${pkg}، وقد تجاوزناها بـ${lessonsCount(-p.remaining)}.`
  return [
    ...parentOpening(client),
    news,
    'نرجو إعلامنا إن كنتم ترغبون في تجديدها.',
    ...parentClosing('شاكرين لكم ثقتكم 🌷', sender),
  ].join('\n')
}

// ── 3. Reminding a parent of a lesson ────────────────────────────────────────

export function lessonReminderText(
  lesson: Pick<WorkLesson, 'date' | 'start' | 'child'>, client: Pick<WorkClient, 'name' | 'childName'>,
  formatDay: (date: string) => string, today: string, sender?: string,
): string {
  const when = lesson.date === today ? 'اليوم' : lesson.date === addDays(today, 1) ? 'غداً' : `يوم ${formatDay(lesson.date)}`
  return [
    ...parentOpening(client),
    `نودّ تذكيركم بموعد ${lessonChild(lesson, client) ? `حصة ${lessonChild(lesson, client)}` : 'الحصة'} ${when} الساعة ${lesson.start} بإذن الله.`,
    'وفي حال طرأ أي ظرف، نرجو التكرّم بإعلامنا مسبقاً.',
    ...parentClosing('شاكرين لكم حسن تعاونكم 🌷', sender),
  ].join('\n')
}

// ── 4. Monthly goal and forecast ─────────────────────────────────────────────

export interface MonthForecast {
  /** Value of work done so far this month. */
  earned: number
  /** Scheduled lessons from today to month end. */
  ahead: number
  /** Past lessons of the month still marked scheduled — neither earned nor ahead. */
  unconfirmed: number
  projected: number
  collected: number
  goal: number | null
  /** projected / goal, 0..∞; null without a goal. */
  progress: number | null
  /** Still needed beyond what is projected; 0 when on track. */
  gap: number | null
}

export function monthForecast(
  lessons: WorkLesson[], payments: WorkPayment[], today: string, goal: number | null | undefined,
): MonthForecast {
  const from = startOfMonth(today), to = endOfMonth(today)
  const st = periodStats(lessons, payments, [], from, to)
  const sched = lessons.filter(l => l.status === 'scheduled' && l.date >= from && l.date <= to)
  const ahead = round2(sched.filter(l => l.date >= today).reduce((s, l) => s + l.price, 0))
  const unconfirmed = round2(sched.filter(l => l.date < today).reduce((s, l) => s + l.price, 0))
  const projected = round2(st.earned + ahead)
  const g = goal && goal > 0 ? goal : null
  return {
    earned: st.earned, ahead, unconfirmed, projected, collected: st.collected, goal: g,
    progress: g ? projected / g : null,
    gap: g ? round2(Math.max(0, g - projected)) : null,
  }
}

// ── 5. A child's progress, lesson by lesson ──────────────────────────────────

export interface ProgressSummary {
  lessons: WorkLesson[]
  rated: number
  average: number | null
  /** Last up-to-5 ratings vs the 5 before them; null without enough of both. */
  trend: { recent: number; before: number } | null
}

/** Done lessons in a range, newest last, with the specialist's ratings summarised. */
export function progressSummary(clientId: string, lessons: WorkLesson[], from: string, to: string): ProgressSummary {
  const done = sortLessons(lessons.filter(l => l.clientId === clientId && l.status === 'done' && l.date >= from && l.date <= to))
  const ratings = done.map(l => l.rating).filter((r): r is number => typeof r === 'number')
  const avg = (xs: number[]) => Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10
  const recent = ratings.slice(-5), before = ratings.slice(-10, -5)
  return {
    lessons: done,
    rated: ratings.length,
    average: ratings.length ? avg(ratings) : null,
    // Fewer than 3 on either side is noise, not a trend.
    trend: recent.length >= 3 && before.length >= 3 ? { recent: avg(recent), before: avg(before) } : null,
  }
}

export function progressText(
  ps: ProgressSummary, client: Pick<WorkClient, 'name' | 'childName'>, formatDay: (date: string) => string, sender?: string,
): string {
  const kids = [...new Set(ps.lessons.map(l => lessonChild(l, client)).filter(Boolean))]
  const whom = kids.length > 1 ? kids.join(' و') : kids[0] ?? client.childName ?? ''
  const lines = [...parentOpening(client), `يسعدنا أن نشارككم ملخّص ${whom ? `حصص ${whom}` : 'الحصص'} الأخيرة:`, '']
  if (!ps.lessons.length) lines.push('لا حصص منجزة في هذه الفترة.')
  for (const l of ps.lessons) {
    const stars = l.rating ? ' ' + '⭐'.repeat(l.rating) : ''
    const whose = kids.length > 1 && lessonChild(l, client) ? ` — ${lessonChild(l, client)}` : ''
    lines.push(`• ${formatDay(l.date)}${whose}${stars}${l.note ? `\n   ${l.note}` : ''}`)
  }
  lines.push(...parentClosing('مع خالص الشكر والتقدير 🌷', sender))
  return lines.join('\n')
}

// ── Calculator in the amount field ───────────────────────────────────────────

/**
 * «12+15+8.5» → 35.5. The expenses of one outing (two Ubers, a coffee, some
 * supplies) are typed as they come, and summed here. Only numbers, + − × ÷
 * and brackets are read — nothing is evaluated as code. Arabic-Indic digits
 * and «٫» are accepted, as a phone keyboard may type them. null = not a sum.
 */
export function evalAmount(input: string): number | null {
  const src = input
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٫,]/g, '.').replace(/[×xX]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/\s+/g, '')
  if (!src || !/^[\d.+\-*/()]+$/.test(src)) return null
  let i = 0
  const peek = () => src[i]
  function num(): number {
    if (peek() === '(') { i++; const v = expr(); if (peek() !== ')') throw new Error(); i++; return v }
    if (peek() === '-') { i++; return -num() }
    const m = /^\d*\.?\d+|^\d+\.?/.exec(src.slice(i))
    if (!m) throw new Error()
    i += m[0].length
    return Number(m[0])
  }
  function term(): number {
    let v = num()
    while (peek() === '*' || peek() === '/') {
      const op = src[i++]; const r = num()
      if (op === '/' && r === 0) throw new Error()
      v = op === '*' ? v * r : v / r
    }
    return v
  }
  function expr(): number {
    let v = term()
    while (peek() === '+' || peek() === '-') { const op = src[i++]; const r = term(); v = op === '+' ? v + r : v - r }
    return v
  }
  try {
    const v = expr()
    if (i !== src.length || !Number.isFinite(v)) return null
    return round2(v)
  } catch { return null }
}

/** True when the text is a calculation rather than a plain number. */
export function isCalculation(input: string): boolean {
  return /\d\s*[+\-*/×÷xX−]\s*[\d(]/.test(input.trim())
}

// ── Fixed monthly expenses ───────────────────────────────────────────────────

const nextMonth = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
}

/** The date a fixed expense falls on in a month — the 31st in a 30-day month is its last day. */
export function recurringDate(month: string, day: number): string {
  const last = Number(endOfMonth(`${month}-01`).slice(8))
  return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`
}

/** Months (and dates) whose fixed expense is due by today and not yet written. Capped at 24 to bound a catch-up. */
export function dueRecurring(items: RecurringExpense[], today: string): { item: RecurringExpense; month: string; date: string }[] {
  const out: { item: RecurringExpense; month: string; date: string }[] = []
  const current = today.slice(0, 7)
  for (const item of items) {
    if (item.paused) continue
    let m = item.lastMonth ? nextMonth(item.lastMonth) : item.since
    for (let n = 0; m <= current && n < 24; m = nextMonth(m), n++) {
      const date = recurringDate(m, item.day)
      if (date > today) break
      out.push({ item, month: m, date })
    }
  }
  return out
}
