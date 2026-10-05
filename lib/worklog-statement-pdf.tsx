/* eslint-disable jsx-a11y/alt-text */
// The family's account statement as a PDF: the same figures as the WhatsApp
// text (buildStatement), laid out to be read at a glance — who, which period,
// three numbers, then every lesson and every payment line by line.
//
// The route computes the statement from the stored ledger; nothing in here
// adds, rounds or re-derives a figure beyond formatting it.
//
// Font and RTL rules are the ones proven in lib/report-pdf.tsx: Tajawal,
// registered from data URIs, and direction:'rtl' on EVERY Text (it does not
// cascade), or a trailing number jumps to the wrong end of the line.
import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { ARABIC_LOCALE, formatDateOnly } from './format'
import {
  PAYMENT_METHOD_LABEL, endTime, formatDuration, formatMoney, isBillable, lessonChild, lessonsCount,
  type Statement, type WorkClient, type WorkCurrency,
} from './worklog'

// ── View model (pure — tested) ───────────────────────────────────────────────

export type RowTone = 'done' | 'charged' | 'free'

export interface StatementPdfRow {
  n: number
  day: string
  time: string
  child?: string
  duration: string
  status: string
  tone: RowTone
  amount: string
  reason?: string
}

export interface StatementPdfModel {
  title: string
  issuer: string
  issuedOn: string
  reference: string
  family: string
  children: string
  childrenLabel: string
  period: string
  tiles: { label: string; value: string; sub?: string; tone: 'plain' | 'paid' | 'due' | 'credit' }[]
  showChild: boolean
  rows: StatementPdfRow[]
  billedTotal: string
  payments: { day: string; method: string; amount: string; note?: string }[]
  paidTotal: string
  balanceLabel: string
  balanceValue: string
  balanceTone: 'due' | 'credit' | 'settled'
  balanceNote: string
  unconfirmedNote?: string
  thanks: string
}

const longDay = (d: string) => formatDateOnly(d, ARABIC_LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const shortDay = (d: string) => formatDateOnly(d, ARABIC_LOCALE, { weekday: 'short', day: 'numeric', month: 'long' })

/** A short, stable reference for the document: family + period, so the same statement always carries the same number. */
export function statementReference(clientId: string, from: string, to: string): string {
  let h = 2166136261
  for (const ch of `${clientId}|${from}|${to}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) }
  return `${to.replace(/-/g, '')}-${(h >>> 0).toString(36).toUpperCase().slice(0, 4).padStart(4, '0')}`
}

export function statementPdfModel(
  st: Statement, client: Pick<WorkClient, 'id' | 'name' | 'childName'>, currency: WorkCurrency,
  opts: { sender?: string; today: string },
): StatementPdfModel {
  const money = (n: number) => formatMoney(n, currency)
  const kids = [...new Set(st.lessons.map(l => lessonChild(l, client)).filter(Boolean))]
  const showChild = kids.length > 1

  const rows: StatementPdfRow[] = st.lessons.map((l, i) => {
    const billable = isBillable(l)
    const tone: RowTone = l.status === 'done' ? 'done' : billable ? 'charged' : 'free'
    return {
      n: i + 1,
      day: shortDay(l.date),
      time: `${l.start}–${endTime(l.start, l.durationMin)}`,
      ...(showChild ? { child: lessonChild(l, client) } : {}),
      duration: formatDuration(l.durationMin),
      status: tone === 'done' ? 'تمّت' : tone === 'charged' ? 'ملغاة · محتسبة' : 'ملغاة · غير محتسبة',
      tone,
      amount: billable ? money(l.price) : '—',
      ...(l.status === 'cancelled' && l.cancelReason ? { reason: l.cancelReason } : {}),
    }
  })

  const balanceTone = st.balance > 0 ? 'due' : st.balance < 0 ? 'credit' : 'settled'
  return {
    title: 'كشف حساب',
    issuer: opts.sender?.trim() || 'Amine Academy',
    issuedOn: longDay(opts.today),
    reference: statementReference(client.id, st.from, st.to),
    family: client.name,
    children: (kids.length ? kids : [client.childName ?? '']).filter(Boolean).join(' و') || '—',
    childrenLabel: kids.length > 2 ? 'الأطفال' : kids.length === 2 ? 'الطفلان' : 'الطفل',
    period: `من ${longDay(st.from)} إلى ${longDay(st.to)}`,
    tiles: [
      { label: 'الحصص المحتسبة', value: lessonsCount(st.billedCount), sub: formatDuration(st.billedMinutes), tone: 'plain' },
      { label: 'قيمة الحصص', value: money(st.billed), tone: 'plain' },
      { label: 'المبالغ المستلمة في الفترة', value: money(st.paidInPeriod), tone: 'paid' },
      {
        label: balanceTone === 'credit' ? 'رصيد مدفوع مسبقاً' : 'المتبقي حتى اليوم',
        value: balanceTone === 'settled' ? 'مسدّد' : money(Math.abs(st.balance)),
        tone: balanceTone === 'due' ? 'due' : balanceTone === 'credit' ? 'credit' : 'paid',
      },
    ],
    showChild,
    rows,
    billedTotal: money(st.billed),
    payments: st.payments.map(p => ({
      day: shortDay(p.date), method: PAYMENT_METHOD_LABEL[p.method], amount: money(p.amount),
      ...(p.lessonsCovered ? { note: `باقة ${lessonsCount(p.lessonsCovered)}` } : p.note ? { note: p.note.slice(0, 60) } : {}),
    })),
    paidTotal: money(st.paidInPeriod),
    balanceLabel: balanceTone === 'credit' ? 'رصيد مدفوع مسبقاً لديكم' : balanceTone === 'due' ? 'المتبقي حتى اليوم' : 'الحساب',
    balanceValue: balanceTone === 'settled' ? 'مسدّد بالكامل' : money(Math.abs(st.balance)),
    balanceTone,
    // The all-time balance, on purpose: a period total alone would hide an older unpaid month.
    balanceNote: balanceTone === 'due'
      ? 'يشمل كل الحصص والمبالغ منذ بداية التعامل، لا هذه الفترة وحدها. نرجو التكرّم بتسويته في الوقت الذي يناسبكم.'
      : balanceTone === 'credit'
        ? 'يُخصم تلقائياً من الحصص القادمة.'
        : 'لا مبالغ مستحقة حتى تاريخ هذا الكشف.',
    ...(st.unconfirmed ? { unconfirmedNote: `${lessonsCount(st.unconfirmed)} في هذه الفترة لم تُحدَّد حالتها بعد، فلا تظهر في الكشف.` } : {}),
    thanks: 'شاكرين لكم حسن تعاونكم وثقتكم',
  }
}

// ── Document ─────────────────────────────────────────────────────────────────

const C = {
  ink: '#1F2937', mute: '#6B7280', faint: '#9CA3AF', line: '#E5E7EB', zebra: '#F9FAFB',
  brand: '#5B21B6', brandSoft: '#F5F3FF', brandLine: '#DDD6FE',
  green: '#15803D', greenBg: '#ECFDF5', rose: '#BE123C', roseBg: '#FFF1F2',
  amber: '#B45309', amberBg: '#FFFBEB', blue: '#1D4ED8', blueBg: '#EFF6FF',
}

const r = { textAlign: 'right' as const, direction: 'rtl' as const }
const s = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 60, paddingHorizontal: 36, fontFamily: 'Tajawal', fontSize: 9.5, color: C.ink, backgroundColor: '#FFFFFF' },
  // Pulled up over the page's top margin, which later pages keep.
  band: { backgroundColor: C.brand, marginTop: -32, marginHorizontal: -36, paddingHorizontal: 36, paddingTop: 26, paddingBottom: 20, marginBottom: 18 },
  bandRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { ...r, fontSize: 22, fontWeight: 700, color: '#FFFFFF' },
  issuer: { ...r, fontSize: 10, color: '#EDE9FE', marginTop: 4 },
  bandMeta: { textAlign: 'left', fontSize: 8.5, color: '#DDD6FE', lineHeight: 1.6 },
  info: { flexDirection: 'row-reverse', borderWidth: 1, borderColor: C.line, borderRadius: 8, marginBottom: 14 },
  infoCell: { flex: 1, paddingVertical: 9, paddingHorizontal: 12 },
  infoSep: { borderLeftWidth: 1, borderLeftColor: C.line },
  label: { ...r, fontSize: 7.5, color: C.mute, marginBottom: 3 },
  value: { ...r, fontSize: 10.5, fontWeight: 700 },
  tiles: { flexDirection: 'row-reverse', marginBottom: 18 },
  tile: { flex: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, marginLeft: 6 },
  tileLabel: { ...r, fontSize: 7.5, marginBottom: 4 },
  tileValue: { ...r, fontSize: 13, fontWeight: 700 },
  tileSub: { ...r, fontSize: 7.5, color: C.mute, marginTop: 2 },
  h2: { ...r, fontSize: 11, fontWeight: 700, color: C.brand, marginBottom: 6 },
  th: { flexDirection: 'row-reverse', backgroundColor: C.brandSoft, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingVertical: 6, paddingHorizontal: 8 },
  thText: { ...r, fontSize: 8, fontWeight: 700, color: C.brand },
  tr: { flexDirection: 'row-reverse', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.6, borderBottomColor: C.line },
  td: { ...r, fontSize: 9 },
  reason: { ...r, fontSize: 7.5, color: C.rose, marginTop: 2 },
  totalRow: { flexDirection: 'row-reverse', paddingVertical: 7, paddingHorizontal: 8, backgroundColor: C.brandSoft, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, marginBottom: 16 },
  totalText: { ...r, fontSize: 9.5, fontWeight: 700 },
  pill: { borderRadius: 8, paddingVertical: 1.5, paddingHorizontal: 6, alignSelf: 'flex-end' },
  pillText: { ...r, fontSize: 7.5, fontWeight: 700 },
  empty: { ...r, fontSize: 9, color: C.faint, paddingVertical: 10, paddingHorizontal: 8 },
  balance: { borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, marginTop: 4, marginBottom: 10 },
  balanceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { ...r, fontSize: 11, fontWeight: 700 },
  balanceValue: { ...r, fontSize: 18, fontWeight: 700 },
  balanceNote: { ...r, fontSize: 8.5, color: C.mute, marginTop: 6, lineHeight: 1.5 },
  warn: { ...r, fontSize: 8, color: C.amber, backgroundColor: C.amberBg, borderRadius: 6, padding: 7, marginBottom: 10 },
  thanks: { ...r, fontSize: 10, color: C.ink, marginTop: 14 },
  sign: { ...r, fontSize: 10, fontWeight: 700, color: C.brand, marginTop: 3 },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, flexDirection: 'row-reverse', justifyContent: 'space-between', borderTopWidth: 0.6, borderTopColor: C.line, paddingTop: 7 },
  footText: { fontSize: 7.5, color: C.faint },
  // Times and the reference are Latin runs: laid out RTL, «16:00–17:00» came out «17:00-16:00».
  ltr: { direction: 'ltr', textAlign: 'right' },
})

const TONE = {
  done: { fg: C.green, bg: C.greenBg },
  charged: { fg: C.amber, bg: C.amberBg },
  free: { fg: C.rose, bg: C.roseBg },
}
const TILE = {
  plain: { fg: C.ink, bg: '#F3F4F6' },
  paid: { fg: C.green, bg: C.greenBg },
  due: { fg: C.rose, bg: C.roseBg },
  credit: { fg: C.blue, bg: C.blueBg },
}
const BAL = { due: TILE.due, credit: TILE.credit, settled: TILE.paid }

export function StatementPdf({ m }: { m: StatementPdfModel }) {
  // Columns, right to left. The child column only exists when two children share the period.
  const cols = m.showChild
    ? { n: 0.35, day: 1.5, time: 1.05, child: 0.95, dur: 0.7, status: 1.35, amt: 0.95 }
    : { n: 0.35, day: 1.7, time: 1.15, child: 0, dur: 0.75, status: 1.45, amt: 1 }

  return (
    <Document title={`${m.title} — ${m.family}`} author={m.issuer} language="ar">
      <Page size="A4" style={s.page} wrap>
        <View style={s.band} fixed={false}>
          <View style={s.bandRow}>
            <View>
              <Text style={s.title}>{m.title}</Text>
              <Text style={s.issuer}>{m.issuer}</Text>
            </View>
            <View>
              <Text style={s.bandMeta}>{`No. ${m.reference}`}</Text>
              <Text style={[s.bandMeta, r]}>{`صدر في ${m.issuedOn}`}</Text>
            </View>
          </View>
        </View>

        <View style={s.info}>
          <View style={s.infoCell}><Text style={s.label}>العائلة</Text><Text style={s.value}>{m.family}</Text></View>
          <View style={[s.infoCell, s.infoSep]}><Text style={s.label}>{m.childrenLabel}</Text><Text style={s.value}>{m.children}</Text></View>
          <View style={[s.infoCell, { flex: 2 }]}><Text style={s.label}>الفترة</Text><Text style={s.value}>{m.period}</Text></View>
        </View>

        <View style={s.tiles}>
          {m.tiles.map((t, i) => (
            <View key={i} style={[s.tile, { backgroundColor: TILE[t.tone].bg }, i === m.tiles.length - 1 ? { marginLeft: 0 } : {}]}>
              <Text style={[s.tileLabel, { color: TILE[t.tone].fg }]}>{t.label}</Text>
              <Text style={[s.tileValue, { color: TILE[t.tone].fg }]}>{t.value}</Text>
              {t.sub ? <Text style={s.tileSub}>{t.sub}</Text> : null}
            </View>
          ))}
        </View>

        {m.unconfirmedNote ? <Text style={s.warn}>{m.unconfirmedNote}</Text> : null}

        <Text style={s.h2}>الحصص</Text>
        <View style={s.th} fixed={false}>
          <Text style={[s.thText, { flex: cols.n }]}>#</Text>
          <Text style={[s.thText, { flex: cols.day }]}>التاريخ</Text>
          <Text style={[s.thText, { flex: cols.time }]}>الوقت</Text>
          {m.showChild ? <Text style={[s.thText, { flex: cols.child }]}>الطفل</Text> : null}
          <Text style={[s.thText, { flex: cols.dur }]}>المدة</Text>
          <Text style={[s.thText, { flex: cols.status }]}>الحالة</Text>
          <Text style={[s.thText, { flex: cols.amt, textAlign: 'left' }]}>المبلغ</Text>
        </View>
        {m.rows.length === 0 ? <Text style={s.empty}>لا حصص في هذه الفترة.</Text> : m.rows.map(row => (
          <View key={row.n} style={[s.tr, row.n % 2 === 0 ? { backgroundColor: C.zebra } : {}]} wrap={false}>
            <Text style={[s.td, { flex: cols.n, color: C.faint }]}>{String(row.n)}</Text>
            <View style={{ flex: cols.day }}>
              <Text style={s.td}>{row.day}</Text>
              {row.reason ? <Text style={s.reason}>{`السبب: ${row.reason}`}</Text> : null}
            </View>
            <Text style={[s.td, s.ltr, { flex: cols.time }]}>{row.time}</Text>
            {m.showChild ? <Text style={[s.td, { flex: cols.child }]}>{row.child ?? ''}</Text> : null}
            <Text style={[s.td, { flex: cols.dur }]}>{row.duration}</Text>
            <View style={{ flex: cols.status }}>
              <View style={[s.pill, { backgroundColor: TONE[row.tone].bg }]}>
                <Text style={[s.pillText, { color: TONE[row.tone].fg }]}>{row.status}</Text>
              </View>
            </View>
            <Text style={[s.td, { flex: cols.amt, textAlign: 'left', fontWeight: 700, color: row.tone === 'free' ? C.faint : C.ink }]}>{row.amount}</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={[s.totalText, { flex: 1 }]}>مجموع الحصص المحتسبة</Text>
          <Text style={[s.totalText, { textAlign: 'left' }]}>{m.billedTotal}</Text>
        </View>

        {m.payments.length > 0 ? (
          <View wrap={false}>
            <Text style={s.h2}>المبالغ المستلمة</Text>
            <View style={s.th}>
              <Text style={[s.thText, { flex: 1.7 }]}>التاريخ</Text>
              <Text style={[s.thText, { flex: 1 }]}>الطريقة</Text>
              <Text style={[s.thText, { flex: 1.6 }]}>ملاحظة</Text>
              <Text style={[s.thText, { flex: 1, textAlign: 'left' }]}>المبلغ</Text>
            </View>
            {m.payments.map((p, i) => (
              <View key={i} style={[s.tr, i % 2 === 1 ? { backgroundColor: C.zebra } : {}]}>
                <Text style={[s.td, { flex: 1.7 }]}>{p.day}</Text>
                <Text style={[s.td, { flex: 1 }]}>{p.method}</Text>
                <Text style={[s.td, { flex: 1.6, color: C.mute }]}>{p.note ?? ''}</Text>
                <Text style={[s.td, { flex: 1, textAlign: 'left', fontWeight: 700, color: C.green }]}>{p.amount}</Text>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={[s.totalText, { flex: 1 }]}>مجموع المستلم في الفترة</Text>
              <Text style={[s.totalText, { textAlign: 'left', color: C.green }]}>{m.paidTotal}</Text>
            </View>
          </View>
        ) : null}

        <View style={[s.balance, { backgroundColor: BAL[m.balanceTone].bg }]} wrap={false}>
          <View style={s.balanceRow}>
            <Text style={[s.balanceLabel, { color: BAL[m.balanceTone].fg }]}>{m.balanceLabel}</Text>
            <Text style={[s.balanceValue, { color: BAL[m.balanceTone].fg }]}>{m.balanceValue}</Text>
          </View>
          <Text style={s.balanceNote}>{m.balanceNote}</Text>
        </View>

        <View wrap={false}>
          <Text style={s.thanks}>{m.thanks}</Text>
          <Text style={s.sign}>{m.issuer}</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          <View style={{ flexDirection: 'row-reverse' }}>
            <Text style={[s.footText, r]}>{`كشف حساب · ${m.family} · `}</Text>
            <Text style={[s.footText, s.ltr]}>{m.reference}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
