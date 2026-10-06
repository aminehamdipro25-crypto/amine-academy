// Three planning aids on top of the ledger, kept pure so they can be tested:
//
//   receivables()    — who owes, and since when (the oldest unpaid lesson)
//   freeSlots()      — when a lesson for a family still fits in the week,
//                      the drive from the previous home and to the next counted
//   weeklyDigest()   — last week in numbers, the week ahead, and who owes
//
// Nothing here is stored: each is recomputed from lessons and payments, so it
// can never disagree with the balances shown elsewhere.

import {
  AVAILABILITY_DEFAULT, addDays, clientBalances, durationText, formatDuration, formatMoney, isBillable, lessonsCount,
  minutesOf, parentClosing, parentOpening, periodStats, sortLessons, travelMinutes, weekdayMon0,
  type Availability, type GeoPoint, type PeriodStats, type WorkClient, type WorkCurrency, type WorkLesson, type WorkPayment,
} from './worklog'

const DAY_MS = 86_400_000
const dayNumber = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / DAY_MS
export const daysBetween = (from: string, to: string) => Math.max(0, Math.round(dayNumber(to) - dayNumber(from)))

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// ── 1. Who owes, and since when ─────────────────────────────────────────────

export interface Receivable {
  clientId: string
  balance: number
  /** The first billable lesson not covered by the payments, oldest first. null when none can be named. */
  oldestUnpaidDate: string | null
  daysOutstanding: number | null
  /** Billable lessons not (fully) covered by what was paid. */
  unpaidLessons: number
  lastPaymentDate: string | null
}

/**
 * Families with something owed, the longest-waiting first. Payments are not
 * tied to lessons, so they are applied to the oldest lessons first — the way
 * a parent reads it: "I paid for September, October is still open". The age
 * of the debt is the age of the first lesson that money did not reach.
 */
export function receivables(
  clients: WorkClient[], lessons: WorkLesson[], payments: WorkPayment[], today: string,
): Receivable[] {
  return clientBalances(clients, lessons, payments, today)
    .filter(b => b.balance > 0)
    .map(b => {
      const billable = sortLessons(lessons.filter(l => l.clientId === b.clientId && isBillable(l)))
      let credit = b.paid
      let i = 0
      for (; i < billable.length; i++) {
        if (credit + 0.005 < billable[i].price) break
        credit -= billable[i].price
      }
      const oldest = billable[i]?.date ?? null
      return {
        clientId: b.clientId,
        balance: b.balance,
        oldestUnpaidDate: oldest,
        daysOutstanding: oldest ? daysBetween(oldest, today) : null,
        unpaidLessons: billable.length - i,
        lastPaymentDate: b.lastPaymentDate,
      }
    })
    .sort((a, b) => (b.daysOutstanding ?? -1) - (a.daysOutstanding ?? -1) || b.balance - a.balance)
}

/** Arabic counted days: يوم واحد · يومان · 3 أيام · 11 يوماً. */
export function daysText(n: number): string {
  if (n === 1) return 'يوم واحد'
  if (n === 2) return 'يومين'
  if (n % 100 >= 3 && n % 100 <= 10) return `${n} أيام`
  return `${n} يوماً`
}

/** Arabic counted families: عائلة واحدة · عائلتان · 3 عائلات · 11 عائلة. */
export function familiesText(n: number): string {
  if (n === 1) return 'عائلة واحدة'
  if (n === 2) return 'عائلتان'
  if (n % 100 >= 3 && n % 100 <= 10) return `${n} عائلات`
  return `${n} عائلة`
}

/** How urgent a debt looks: under two weeks is routine, over a month is worth a word. */
export function debtAge(days: number | null): 'fresh' | 'due' | 'late' {
  if (days === null || days < 14) return 'fresh'
  return days < 30 ? 'due' : 'late'
}

// ── 2. When am I free? ───────────────────────────────────────────────────────

/** Drive assumed between two homes when either has no pin: short, but never zero. */
export const UNKNOWN_TRAVEL_MIN = 15

export interface FreeWindow {
  /** Earliest and latest time the lesson can START — the whole lesson fits between earliest and latest + duration. */
  earliest: string
  latest: string
}
export interface FreeDay { date: string; windows: FreeWindow[] }

export interface FreeSlotOptions {
  from: string
  days: number
  durationMin: number
  availability?: Availability
  /** The family the time is for — the drive from/to its home is counted. Absent = a new family, no pin yet. */
  clientId?: string
  locate: (clientId: string) => GeoPoint | undefined
  /** Today and the current minute: nothing in the past is offered. */
  today?: string
  nowMin?: number
  /** Start times are offered on this grid (minutes). */
  step?: number
}

/**
 * Free start times per day inside the working hours. Around every lesson
 * already in the agenda (cancelled ones free their time) the drive to and
 * from the new family's home is reserved, so an offered time can be kept.
 */
export function freeSlots(lessons: WorkLesson[], o: FreeSlotOptions): FreeDay[] {
  const av = o.availability ?? AVAILABILITY_DEFAULT
  const step = o.step ?? 15
  const target = o.clientId
  // The owner's own floor: at least this long between lessons at two homes, whatever the map says.
  const gap = av.gapMin ?? AVAILABILITY_DEFAULT.gapMin ?? 0
  const travel = (a: string | undefined, b: string | undefined): number => {
    if (a && a === b) return 0 // the same home twice in a row: no drive
    const pa = a ? o.locate(a) : undefined, pb = b ? o.locate(b) : undefined
    return Math.max(gap, pa && pb ? travelMinutes(pa, pb) : UNKNOWN_TRAVEL_MIN)
  }
  const up = (m: number) => Math.ceil(m / step) * step
  const down = (m: number) => Math.floor(m / step) * step

  const out: FreeDay[] = []
  for (let i = 0; i < Math.max(1, Math.min(31, o.days)); i++) {
    const date = addDays(o.from, i)
    if (o.today && date < o.today) continue
    if (!av.days.includes(weekdayMon0(date))) continue
    let open = minutesOf(av.start)
    const close = minutesOf(av.end)
    if (o.today && date === o.today && o.nowMin !== undefined) open = Math.max(open, o.nowMin)

    const busy = sortLessons(lessons.filter(l => l.date === date && l.status !== 'cancelled'))
    const gaps: [number, number][] = []
    let cursor = open
    let prevClient: string | undefined
    for (const b of busy) {
      const bs = minutesOf(b.start), be = bs + b.durationMin
      const gapStart = prevClient === undefined ? cursor : cursor + travel(prevClient, target)
      const gapEnd = bs - travel(target, b.clientId)
      gaps.push([gapStart, gapEnd])
      if (be >= cursor) { cursor = be; prevClient = b.clientId }
    }
    gaps.push([prevClient === undefined ? cursor : cursor + travel(prevClient, target), close])

    const windows: FreeWindow[] = []
    for (const [s, e] of gaps) {
      const earliest = up(Math.max(s, open))
      const latest = down(Math.min(e, close) - o.durationMin)
      if (latest >= earliest) windows.push({ earliest: hhmm(earliest), latest: hhmm(latest) })
    }
    if (windows.length) out.push({ date, windows })
  }
  return out
}

export function windowText(w: FreeWindow): string {
  return w.earliest === w.latest ? `الساعة ${w.earliest}` : `بين ${w.earliest} و${w.latest}`
}

/** The reply to a family asking for a time. Start times, not ranges: «بين 16:00 و18:00» means the lesson may start then. */
export function availabilityText(
  days: FreeDay[], o: { client?: Pick<WorkClient, 'name'>; durationMin: number; formatDay: (d: string) => string; sender?: string },
): string {
  const lines = parentOpening(o.client ?? { name: '' })
  lines.push(`يسعدنا تواصلكم. هذه الأوقات المتاحة لدينا لبدء الحصة (مدتها ${durationText(o.durationMin)}):`)
  lines.push('')
  if (!days.length) lines.push('لا أوقات متاحة في الأيام القادمة، وسنعلمكم فور توفّر موعد.')
  for (const d of days) lines.push(`• ${o.formatDay(d.date)}: ${d.windows.map(windowText).join('، أو ')}`)
  lines.push('')
  lines.push('نرجو التكرّم باختيار الوقت الذي يناسبكم، وسنؤكّد الموعد مباشرة.')
  lines.push(...parentClosing('مع خالص الشكر والتقدير 🌷', o.sender))
  return lines.join('\n')
}

// ── 3. The week in numbers ───────────────────────────────────────────────────

export interface WeeklyDigest {
  /** The seven days before today. */
  from: string
  to: string
  last: PeriodStats
  /** Scheduled in the seven days from today. */
  ahead: { lessons: number; minutes: number; value: number }
  owed: { total: number; families: number; oldest: Receivable[] }
  unconfirmed: number
}

export function weeklyDigest(
  clients: WorkClient[], lessons: WorkLesson[], payments: WorkPayment[], expenses: Parameters<typeof periodStats>[2], today: string,
): WeeklyDigest {
  const from = addDays(today, -7), to = addDays(today, -1)
  const next = lessons.filter(l => l.status === 'scheduled' && l.date >= today && l.date <= addDays(today, 6))
  const rec = receivables(clients, lessons, payments, today)
  return {
    from, to,
    last: periodStats(lessons, payments, expenses, from, to),
    ahead: {
      lessons: next.length,
      minutes: next.reduce((s, l) => s + l.durationMin, 0),
      value: next.reduce((s, l) => s + l.price, 0),
    },
    owed: { total: rec.reduce((s, r) => s + r.balance, 0), families: rec.length, oldest: rec.slice(0, 3) },
    unconfirmed: lessons.filter(l => l.status === 'scheduled' && l.date < today).length,
  }
}

/** Plain lines (the sender escapes and styles them). The first line is the title. */
export function weeklyDigestLines(
  d: WeeklyDigest, name: (clientId: string) => string, currency: WorkCurrency, formatDay: (date: string) => string,
): string[] {
  const money = (n: number) => formatMoney(n, currency)
  const s = d.last
  const lines = [`📊 أسبوعك من ${formatDay(d.from)} إلى ${formatDay(d.to)}`]
  if (s.lessonsDone || s.lessonsCancelled || s.collected || s.expenses) {
    lines.push(`✓ ${lessonsCount(s.lessonsDone)} منجزة · ${formatDuration(s.minutesDone)}`)
    lines.push(`💼 قيمة العمل: ${money(s.earned)} · المستلم: ${money(s.collected)}`)
    if (s.expenses) lines.push(`🧾 المصاريف: ${money(s.expenses)} · الصافي: ${money(s.net)}`)
    if (s.lessonsCancelled) lines.push(`✕ ${lessonsCount(s.lessonsCancelled)} ملغاة${s.lostToCancellations ? ` (ضاع ${money(s.lostToCancellations)})` : ''}`)
  } else {
    lines.push('لا حصص مسجّلة في الأسبوع الماضي.')
  }
  lines.push('')
  lines.push(d.ahead.lessons
    ? `📅 هذا الأسبوع: ${lessonsCount(d.ahead.lessons)} مجدولة · ${formatDuration(d.ahead.minutes)} · ${money(d.ahead.value)}`
    : '📅 لا حصص مجدولة هذا الأسبوع بعد.')
  if (d.owed.families) {
    lines.push('')
    lines.push(`💰 مستحقات: ${money(d.owed.total)} لدى ${familiesText(d.owed.families)}`)
    for (const r of d.owed.oldest) {
      lines.push(`  - ${name(r.clientId)}: ${money(r.balance)}${r.daysOutstanding ? ` · منذ ${daysText(r.daysOutstanding)}` : ''}`)
    }
  }
  if (d.unconfirmed) lines.push(`⚠️ ${lessonsCount(d.unconfirmed)} سابقة لم تُحدَّد حالتها — لا تدخل الأرقام أعلاه`)
  return lines
}
