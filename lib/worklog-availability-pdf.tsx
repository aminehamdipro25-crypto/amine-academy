// «متى أنا متاح؟» as a one-page PDF to send a family: each day with the times
// a lesson can start. Built from the same freeSlots the sheet shows.
//
// Font registration lives in lib/pdf-fonts.ts — call registerTajawal() first.

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { ARABIC_LOCALE, formatDateOnly } from './format'
import { durationText } from './worklog'
import type { FreeDay } from './worklog-planning'

export interface AvailabilityPdfModel {
  title: string
  to: string
  duration: string
  range: string
  issuer: string
  issuedOn: string
  /** Each slot is [earliest, latest] start time; the same twice = one exact time. */
  days: { weekday: string; date: string; slots: [string, string][] }[]
  explain: string
  closing: string
}

const fmt = (d: string, o: Intl.DateTimeFormatOptions) => formatDateOnly(d, ARABIC_LOCALE, o)

export function availabilityPdfModel(
  days: FreeDay[], o: { family?: string; durationMin: number; sender?: string; today: string },
): AvailabilityPdfModel {
  const open = days.filter(d => d.windows.length)
  const first = open[0]?.date ?? o.today, last = open.at(-1)?.date ?? o.today
  return {
    title: 'المواعيد المتاحة',
    to: o.family?.trim() ? `إلى: ${o.family.trim()}` : '',
    duration: `مدة الحصة: ${durationText(o.durationMin)}`,
    range: open.length ? `من ${fmt(first, { day: 'numeric', month: 'long' })} إلى ${fmt(last, { day: 'numeric', month: 'long', year: 'numeric' })}` : '',
    issuer: o.sender?.trim() || 'Amine Academy',
    issuedOn: fmt(o.today, { day: 'numeric', month: 'long', year: 'numeric' }),
    days: open.map(d => ({
      weekday: fmt(d.date, { weekday: 'long' }),
      date: fmt(d.date, { day: 'numeric', month: 'long' }),
      // A range is of START times: «14:00 – 15:30» = the lesson may start any time between.
      slots: d.windows.map(w => [w.earliest, w.latest] as [string, string]),
    })),
    explain: 'الأوقات المذكورة هي أوقات بدء الحصة: كل خانة فيها وقتان تعني أن الحصة يمكن أن تبدأ في أي وقت بينهما.',
    closing: 'نرجو التكرّم باختيار الوقت الذي يناسبكم، وسنؤكّد الموعد مباشرة. مع خالص الشكر والتقدير.',
  }
}

const C = {
  ink: '#1F2937', mute: '#6B7280', faint: '#9CA3AF', line: '#E5E7EB',
  brand: '#5B21B6', brandSoft: '#F5F3FF', green: '#047857', greenBg: '#ECFDF5', greenLine: '#A7F3D0',
}
const r = { textAlign: 'right' as const, direction: 'rtl' as const }
const s = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 56, paddingHorizontal: 36, fontFamily: 'Tajawal', fontSize: 10, color: C.ink },
  band: { backgroundColor: C.brand, marginTop: -32, marginHorizontal: -36, paddingHorizontal: 36, paddingTop: 26, paddingBottom: 20, marginBottom: 18 },
  bandRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { ...r, fontSize: 22, fontWeight: 700, color: '#FFFFFF' },
  sub: { ...r, fontSize: 10.5, color: '#EDE9FE', marginTop: 4 },
  meta: { ...r, fontSize: 9, color: '#DDD6FE', lineHeight: 1.6 },
  info: { flexDirection: 'row-reverse', justifyContent: 'space-between', backgroundColor: C.brandSoft, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 14 },
  infoText: { ...r, fontSize: 10.5, fontWeight: 700, color: C.brand },
  day: { flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  dayHead: { width: 110 },
  weekday: { ...r, fontSize: 12, fontWeight: 700 },
  date: { ...r, fontSize: 9, color: C.mute, marginTop: 2 },
  slots: { flex: 1, flexDirection: 'row-reverse', flexWrap: 'wrap' },
  slot: { backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenLine, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, marginLeft: 6, marginBottom: 4 },
  // Start, dash and end are laid out as three pieces in a left-to-right row:
  // as one string inside RTL text, «14:00 – 20:00» was drawn «20:00 – 14:00».
  slotRow: { flexDirection: 'row', alignItems: 'center' },
  slotText: { fontSize: 11, fontWeight: 700, color: C.green },
  slotDash: { fontSize: 11, color: C.green, marginHorizontal: 4 },
  explain: { ...r, fontSize: 8.5, color: C.mute, marginTop: 8, lineHeight: 1.5 },
  closing: { ...r, fontSize: 10, marginTop: 14, lineHeight: 1.6 },
  sign: { ...r, fontSize: 10.5, fontWeight: 700, color: C.brand, marginTop: 4 },
  empty: { ...r, fontSize: 11, color: C.faint, paddingVertical: 30, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 22, left: 36, right: 36, flexDirection: 'row-reverse', justifyContent: 'space-between', borderTopWidth: 0.6, borderTopColor: C.line, paddingTop: 6 },
  foot: { fontSize: 7.5, color: C.faint },
})

export function AvailabilityPdf({ m }: { m: AvailabilityPdfModel }) {
  return (
    <Document title={m.title} author={m.issuer} language="ar">
      <Page size="A4" style={s.page} wrap>
        <View style={s.band}>
          <View style={s.bandRow}>
            <View>
              <Text style={s.title}>{m.title}</Text>
              <Text style={s.sub}>{m.issuer}</Text>
            </View>
            <View>
              {m.to ? <Text style={s.meta}>{m.to}</Text> : null}
              <Text style={s.meta}>{`صدر في ${m.issuedOn}`}</Text>
            </View>
          </View>
        </View>

        <View style={s.info}>
          <Text style={s.infoText}>{m.duration}</Text>
          {m.range ? <Text style={s.infoText}>{m.range}</Text> : null}
        </View>

        {m.days.length === 0 ? <Text style={s.empty}>لا أوقات متاحة في هذه الفترة، وسنعلمكم فور توفّر موعد.</Text> : m.days.map((d, i) => (
          <View key={i} style={s.day} wrap={false}>
            <View style={s.dayHead}>
              <Text style={s.weekday}>{d.weekday}</Text>
              <Text style={s.date}>{d.date}</Text>
            </View>
            <View style={s.slots}>
              {d.slots.map(([a, b], j) => (
                <View key={j} style={[s.slot, s.slotRow]}>
                  <Text style={s.slotText}>{a}</Text>
                  {a !== b ? <><Text style={s.slotDash}>–</Text><Text style={s.slotText}>{b}</Text></> : null}
                </View>
              ))}
            </View>
          </View>
        ))}

        {m.days.length > 0 && <Text style={s.explain}>{m.explain}</Text>}
        <Text style={s.closing}>{m.closing}</Text>
        <Text style={s.sign}>{m.issuer}</Text>

        <View style={s.footer} fixed>
          <Text style={s.foot} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          <Text style={[s.foot, r]}>{`${m.title} · ${m.issuer}`}</Text>
        </View>
      </Page>
    </Document>
  )
}
