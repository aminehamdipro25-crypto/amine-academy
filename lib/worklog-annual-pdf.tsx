// The year at a glance, as a PDF: every month with its hours and money, each
// family's share, where the expenses went and what cancellations cost. Built
// from the same periodStats the Statistics tab uses, so the two cannot differ.
//
// Font registration lives in lib/pdf-fonts.ts — call registerTajawal() first.

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { ARABIC_LOCALE, formatDateOnly } from './format'
import {
  EXPENSE_LABEL, formatHours, formatMoney, lessonsCount, periodStats,
  type WorkClient, type WorkCurrency, type WorkExpense, type WorkLesson, type WorkPayment,
} from './worklog'

// ── View model (pure — tested) ───────────────────────────────────────────────

export interface AnnualMonth {
  label: string
  lessons: number
  hours: string
  earned: string
  collected: string
  expenses: string
  net: string
  /** 0–1, the month's work value against the best month — drawn as a bar. */
  share: number
  best: boolean
  empty: boolean
}

export interface AnnualModel {
  year: number
  title: string
  issuer: string
  issuedOn: string
  /** «حتى 6 أكتوبر» while the year is still running. */
  coverage: string
  tiles: { label: string; value: string; sub?: string; tone: 'plain' | 'paid' | 'cost' | 'net' }[]
  months: AnnualMonth[]
  totals: Omit<AnnualMonth, 'label' | 'share' | 'best' | 'empty'>
  families: { name: string; lessons: number; hours: string; earned: string; collected: string }[]
  expenses: { label: string; amount: string; pct: number }[]
  cancellations: { line: string; lost?: string } | null
  notes: string[]
  empty: boolean
}

const longDay = (d: string) => formatDateOnly(d, ARABIC_LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
const monthName = (m: string) => formatDateOnly(`${m}-01`, ARABIC_LOCALE, { month: 'long' })

export function annualModel(
  year: number,
  data: { clients: WorkClient[]; lessons: WorkLesson[]; payments: WorkPayment[]; expenses: WorkExpense[] },
  currency: WorkCurrency,
  opts: { sender?: string; today: string },
): AnnualModel {
  const money = (n: number) => formatMoney(n, currency)
  const hours = (min: number) => `${formatHours(min)} س`
  const from = `${year}-01-01`, to = `${year}-12-31`
  const { lessons, payments, expenses } = data
  const y = periodStats(lessons, payments, expenses, from, to)
  const names = new Map(data.clients.map(c => [c.id, c.childName ? `${c.childName} · ${c.name}` : c.name]))

  const raw = Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`
    const last = new Date(Date.UTC(year, i + 1, 0)).toISOString().slice(0, 10)
    return { m, s: periodStats(lessons, payments, expenses, `${m}-01`, last) }
  })
  const maxEarned = Math.max(0, ...raw.map(r => r.s.earned))
  const months: AnnualMonth[] = raw.map(({ m, s }) => ({
    label: monthName(m),
    lessons: s.lessonsDone,
    hours: s.minutesDone ? hours(s.minutesDone) : '—',
    earned: s.earned ? money(s.earned) : '—',
    collected: s.collected ? money(s.collected) : '—',
    expenses: s.expenses ? money(s.expenses) : '—',
    net: s.collected || s.expenses ? money(s.net) : '—',
    share: maxEarned ? s.earned / maxEarned : 0,
    best: maxEarned > 0 && s.earned === maxEarned,
    empty: !s.lessonsDone && !s.earned && !s.collected && !s.expenses,
  }))

  const unconfirmed = lessons.filter(l => l.status === 'scheduled' && l.date >= from && l.date <= to && l.date < opts.today).length
  const running = opts.today >= from && opts.today <= to
  const decided = y.lessonsDone + y.lessonsCancelled
  const totalExp = y.byExpenseCategory.reduce((a, c) => a + c.amount, 0)

  return {
    year,
    title: `التقرير السنوي ${year}`,
    issuer: opts.sender?.trim() || 'Amine Academy',
    issuedOn: longDay(opts.today),
    coverage: running ? `من 1 يناير حتى ${longDay(opts.today)}` : `من 1 يناير إلى 31 ديسمبر ${year}`,
    tiles: [
      { label: 'قيمة العمل المنجز', value: money(y.earned), sub: `${lessonsCount(y.lessonsDone)} · ${hours(y.minutesDone)}`, tone: 'plain' },
      { label: 'المبالغ المستلمة', value: money(y.collected), tone: 'paid' },
      { label: 'المصاريف', value: money(y.expenses), tone: 'cost' },
      { label: 'الصافي (المستلم − المصاريف)', value: money(y.net), sub: y.avgHourly !== null ? `متوسط الساعة ${money(y.avgHourly)}` : undefined, tone: 'net' },
    ],
    months,
    totals: {
      lessons: y.lessonsDone, hours: hours(y.minutesDone), earned: money(y.earned),
      collected: money(y.collected), expenses: money(y.expenses), net: money(y.net),
    },
    families: y.byClient.filter(c => c.lessons || c.earned || c.collected).map(c => ({
      name: names.get(c.clientId) ?? 'عائلة محذوفة',
      lessons: c.lessons, hours: hours(c.minutes), earned: money(c.earned), collected: money(c.collected),
    })),
    expenses: y.byExpenseCategory.map(e => ({ label: EXPENSE_LABEL[e.category], amount: money(e.amount), pct: totalExp ? e.amount / totalExp : 0 })),
    cancellations: y.lessonsCancelled
      ? {
          line: `${lessonsCount(y.lessonsCancelled)} ملغاة من ${decided} (${Math.round((y.cancellationRate ?? 0) * 100)}%) — ${y.cancelledByFamily} من العائلات و${y.cancelledByMe} منك`,
          ...(y.lostToCancellations ? { lost: money(y.lostToCancellations) } : {}),
        }
      : null,
    notes: [
      'قيمة العمل = الحصص المنجزة والملغاة المحتسبة. المستلم = ما دُفع فعلاً في الشهر نفسه، وقد يخصّ حصصاً من شهر سابق.',
      ...(unconfirmed ? [`${lessonsCount(unconfirmed)} سابقة من هذه السنة لم تُحدَّد حالتها، فلا تدخل الأرقام أعلاه.`] : []),
    ],
    empty: !y.lessonsDone && !y.lessonsCancelled && !y.collected && !y.expenses,
  }
}

// ── Document ─────────────────────────────────────────────────────────────────

const C = {
  ink: '#1F2937', mute: '#6B7280', faint: '#9CA3AF', line: '#E5E7EB', zebra: '#F9FAFB',
  brand: '#5B21B6', brandSoft: '#F5F3FF', bar: '#A78BFA',
  green: '#15803D', greenBg: '#ECFDF5', amber: '#B45309', amberBg: '#FFFBEB', blue: '#1D4ED8', blueBg: '#EFF6FF',
  rose: '#BE123C', roseBg: '#FFF1F2',
}
const r = { textAlign: 'right' as const, direction: 'rtl' as const }
const s = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 56, paddingHorizontal: 34, fontFamily: 'Tajawal', fontSize: 9, color: C.ink },
  band: { backgroundColor: C.brand, marginTop: -32, marginHorizontal: -34, paddingHorizontal: 34, paddingTop: 24, paddingBottom: 18, marginBottom: 16 },
  bandRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { ...r, fontSize: 21, fontWeight: 700, color: '#FFFFFF' },
  sub: { ...r, fontSize: 10, color: '#EDE9FE', marginTop: 4 },
  meta: { ...r, fontSize: 8.5, color: '#DDD6FE', lineHeight: 1.6 },
  tiles: { flexDirection: 'row-reverse', marginBottom: 16 },
  tile: { flex: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, marginLeft: 6 },
  tileLabel: { ...r, fontSize: 7.5, marginBottom: 4 },
  tileValue: { ...r, fontSize: 13, fontWeight: 700 },
  tileSub: { ...r, fontSize: 7.5, color: C.mute, marginTop: 2 },
  h2: { ...r, fontSize: 11, fontWeight: 700, color: C.brand, marginBottom: 6, marginTop: 4 },
  th: { flexDirection: 'row-reverse', backgroundColor: C.brandSoft, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingVertical: 6, paddingHorizontal: 8 },
  thText: { ...r, fontSize: 7.5, fontWeight: 700, color: C.brand },
  tr: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.6, borderBottomColor: C.line },
  td: { ...r, fontSize: 8.5 },
  total: { flexDirection: 'row-reverse', paddingVertical: 7, paddingHorizontal: 8, backgroundColor: C.brandSoft, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, marginBottom: 14 },
  totalText: { ...r, fontSize: 8.5, fontWeight: 700 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: '#EDE9FE', flexDirection: 'row-reverse' },
  bar: { height: 6, borderRadius: 3, backgroundColor: C.bar },
  twoCol: { flexDirection: 'row-reverse' },
  col: { flex: 1 },
  box: { borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 10, marginBottom: 10 },
  line: { ...r, fontSize: 8.5, marginBottom: 3 },
  note: { ...r, fontSize: 7.5, color: C.mute, lineHeight: 1.5, marginBottom: 2 },
  empty: { ...r, fontSize: 10, color: C.faint, paddingVertical: 30, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 22, left: 34, right: 34, flexDirection: 'row-reverse', justifyContent: 'space-between', borderTopWidth: 0.6, borderTopColor: C.line, paddingTop: 6 },
  foot: { fontSize: 7.5, color: C.faint },
})
const TILE = {
  plain: { fg: C.ink, bg: '#F3F4F6' }, paid: { fg: C.green, bg: C.greenBg },
  cost: { fg: C.amber, bg: C.amberBg }, net: { fg: C.blue, bg: C.blueBg },
}

export function AnnualPdf({ m }: { m: AnnualModel }) {
  // Month table columns, right to left.
  const k = { month: 1.05, lessons: 0.55, hours: 0.75, earned: 1, bar: 1.1, collected: 1, expenses: 0.9, net: 1 }
  return (
    <Document title={m.title} author={m.issuer} language="ar">
      <Page size="A4" style={s.page} wrap>
        <View style={s.band}>
          <View style={s.bandRow}>
            <View>
              <Text style={s.title}>{m.title}</Text>
              <Text style={s.sub}>{`دفتر الحصص الخاصة · ${m.issuer}`}</Text>
            </View>
            <View>
              <Text style={s.meta}>{m.coverage}</Text>
              <Text style={s.meta}>{`صدر في ${m.issuedOn}`}</Text>
            </View>
          </View>
        </View>

        {m.empty ? <Text style={s.empty}>لا حصص ولا دفعات مسجّلة في هذه السنة.</Text> : (
          <>
            <View style={s.tiles}>
              {m.tiles.map((t, i) => (
                <View key={i} style={[s.tile, { backgroundColor: TILE[t.tone].bg }, i === m.tiles.length - 1 ? { marginLeft: 0 } : {}]}>
                  <Text style={[s.tileLabel, { color: TILE[t.tone].fg }]}>{t.label}</Text>
                  <Text style={[s.tileValue, { color: TILE[t.tone].fg }]}>{t.value}</Text>
                  {t.sub ? <Text style={s.tileSub}>{t.sub}</Text> : null}
                </View>
              ))}
            </View>

            <Text style={s.h2}>شهراً بشهر</Text>
            <View style={s.th}>
              <Text style={[s.thText, { flex: k.month }]}>الشهر</Text>
              <Text style={[s.thText, { flex: k.lessons }]}>الحصص</Text>
              <Text style={[s.thText, { flex: k.hours }]}>الساعات</Text>
              <Text style={[s.thText, { flex: k.earned }]}>قيمة العمل</Text>
              <Text style={[s.thText, { flex: k.bar }]}> </Text>
              <Text style={[s.thText, { flex: k.collected }]}>المستلم</Text>
              <Text style={[s.thText, { flex: k.expenses }]}>المصاريف</Text>
              <Text style={[s.thText, { flex: k.net, textAlign: 'left' }]}>الصافي</Text>
            </View>
            {m.months.map((mo, i) => (
              <View key={i} style={[s.tr, i % 2 ? { backgroundColor: C.zebra } : {}]} wrap={false}>
                <Text style={[s.td, { flex: k.month, fontWeight: mo.best ? 700 : 400, color: mo.empty ? C.faint : C.ink }]}>{mo.best ? `${mo.label} (الأعلى)` : mo.label}</Text>
                <Text style={[s.td, { flex: k.lessons, color: mo.empty ? C.faint : C.ink }]}>{mo.empty ? '—' : String(mo.lessons)}</Text>
                <Text style={[s.td, { flex: k.hours, color: mo.empty ? C.faint : C.ink }]}>{mo.hours}</Text>
                <Text style={[s.td, { flex: k.earned, fontWeight: 700, color: mo.empty ? C.faint : C.ink }]}>{mo.earned}</Text>
                <View style={{ flex: k.bar, paddingLeft: 6 }}>
                  <View style={s.barTrack}>{mo.share > 0 ? <View style={[s.bar, { width: `${Math.max(3, Math.round(mo.share * 100))}%` }]} /> : null}</View>
                </View>
                <Text style={[s.td, { flex: k.collected, color: mo.empty ? C.faint : C.green }]}>{mo.collected}</Text>
                <Text style={[s.td, { flex: k.expenses, color: mo.empty ? C.faint : C.amber }]}>{mo.expenses}</Text>
                <Text style={[s.td, { flex: k.net, textAlign: 'left', color: mo.empty ? C.faint : C.blue }]}>{mo.net}</Text>
              </View>
            ))}
            <View style={s.total} wrap={false}>
              <Text style={[s.totalText, { flex: k.month }]}>المجموع</Text>
              <Text style={[s.totalText, { flex: k.lessons }]}>{String(m.totals.lessons)}</Text>
              <Text style={[s.totalText, { flex: k.hours }]}>{m.totals.hours}</Text>
              <Text style={[s.totalText, { flex: k.earned }]}>{m.totals.earned}</Text>
              <Text style={[s.totalText, { flex: k.bar }]}> </Text>
              <Text style={[s.totalText, { flex: k.collected, color: C.green }]}>{m.totals.collected}</Text>
              <Text style={[s.totalText, { flex: k.expenses, color: C.amber }]}>{m.totals.expenses}</Text>
              <Text style={[s.totalText, { flex: k.net, textAlign: 'left', color: C.blue }]}>{m.totals.net}</Text>
            </View>

            {m.families.length > 0 && (
              <View wrap={false}>
                <Text style={s.h2}>حسب العائلة</Text>
                <View style={s.th}>
                  <Text style={[s.thText, { flex: 2.2 }]}>العائلة</Text>
                  <Text style={[s.thText, { flex: 0.7 }]}>الحصص</Text>
                  <Text style={[s.thText, { flex: 0.8 }]}>الساعات</Text>
                  <Text style={[s.thText, { flex: 1 }]}>قيمة العمل</Text>
                  <Text style={[s.thText, { flex: 1, textAlign: 'left' }]}>المستلم</Text>
                </View>
                {m.families.map((f, i) => (
                  <View key={i} style={[s.tr, i % 2 ? { backgroundColor: C.zebra } : {}]}>
                    <Text style={[s.td, { flex: 2.2 }]}>{f.name}</Text>
                    <Text style={[s.td, { flex: 0.7 }]}>{String(f.lessons)}</Text>
                    <Text style={[s.td, { flex: 0.8 }]}>{f.hours}</Text>
                    <Text style={[s.td, { flex: 1, fontWeight: 700 }]}>{f.earned}</Text>
                    <Text style={[s.td, { flex: 1, textAlign: 'left', color: C.green }]}>{f.collected}</Text>
                  </View>
                ))}
                <View style={{ height: 14 }} />
              </View>
            )}

            <View style={s.twoCol} wrap={false}>
              <View style={[s.col, { marginLeft: 8 }]}>
                <Text style={s.h2}>أين ذهبت المصاريف</Text>
                <View style={s.box}>
                  {m.expenses.length ? m.expenses.map((e, i) => (
                    <View key={i} style={{ marginBottom: 5 }}>
                      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                        <Text style={s.line}>{e.label}</Text>
                        <Text style={[s.line, { fontWeight: 700 }]}>{e.amount}</Text>
                      </View>
                      <View style={s.barTrack}><View style={[s.bar, { backgroundColor: '#F59E0B', width: `${Math.max(3, Math.round(e.pct * 100))}%` }]} /></View>
                    </View>
                  )) : <Text style={s.line}>لا مصاريف مسجّلة.</Text>}
                </View>
              </View>
              <View style={s.col}>
                <Text style={s.h2}>الإلغاءات</Text>
                <View style={s.box}>
                  {m.cancellations ? (
                    <>
                      <Text style={s.line}>{m.cancellations.line}</Text>
                      {m.cancellations.lost ? <Text style={[s.line, { color: C.rose }]}>{`قيمة ضاعت بالإلغاء غير المحتسب: ${m.cancellations.lost}`}</Text> : null}
                    </>
                  ) : <Text style={s.line}>لا إلغاءات هذه السنة.</Text>}
                </View>
              </View>
            </View>

            {m.notes.map((n, i) => <Text key={i} style={s.note}>{`• ${n}`}</Text>)}
          </>
        )}

        <View style={s.footer} fixed>
          <Text style={s.foot} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          <Text style={[s.foot, r]}>{`${m.title} · ${m.issuer}`}</Text>
        </View>
      </Page>
    </Document>
  )
}
