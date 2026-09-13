/* eslint-disable jsx-a11y/alt-text */
// Server-rendered PDF of the specialist toolkit report.
//
// WHY: printing the report from the browser was unreliable — on a long report
// Chrome silently stopped painting before the signature/disclaimer block, and
// the only configuration that printed it forced the footer onto a near-empty
// page of its own. Output also varied with each user's paper size and print
// settings. Rendering the document here makes it byte-identical for every
// recipient and lets the footer sit where it belongs, at the end of the flow.
//
// FONT: Tajawal (static, SIL OFL). The brand's Cairo ships only as a variable
// font, and fontkit renders it with the Arabic letters disconnected — verified
// by rendering both and comparing. Tajawal is a modern sans in the same spirit
// and shapes correctly.
import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface PdfScale {
  name: string
  provenance: string
  severityLabel: string
  ageCaution?: string
  domains: { label: string; score: number }[]
  recommendations: string[]
  supportiveNote?: string
}

export interface PdfTask {
  labelAr: string
  domainAr: string
  headline: string
  details: string[]
  caution?: string
}

export interface PdfReportData {
  childName: string
  age: string
  gender: string
  parentName?: string
  therapistName?: string
  dateLabel: string
  intro: string
  confidentialLabel: string
  disclaimer: string
  scales: PdfScale[]
  tasks: PdfTask[]
  batterySummary?: string
  frequency?: string
  actionPlan: string[]
  redFlags: string[]
}

const C = {
  ink: '#111827', mute: '#6B7280', faint: '#9CA3AF',
  line: '#E5E7EB', teal: '#0F766E', tealBg: '#F0FDFA',
  amber: '#B45309', amberBg: '#FFFBEB', indigo: '#4338CA', indigoBg: '#EEF2FF',
}

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 40, fontFamily: 'Tajawal', fontSize: 9.5, color: C.ink },
  // Every text block is right-aligned: react-pdf has no bidi engine, so RTL is
  // expressed through alignment while the font handles the shaping.
  rtl: { textAlign: 'right' },
  brand: { fontSize: 15, fontWeight: 700, textAlign: 'right', color: C.ink },
  tagline: { fontSize: 8, color: C.faint, textAlign: 'right', marginTop: 2 },
  rule: { borderBottomWidth: 1.5, borderBottomColor: C.ink, marginTop: 8, marginBottom: 10 },
  h1: { fontSize: 13, fontWeight: 700, textAlign: 'right', marginBottom: 2 },
  meta: { fontSize: 8.5, color: C.mute, textAlign: 'right' },
  notice: { borderWidth: 1, borderColor: C.line, borderRadius: 4, padding: 7, marginTop: 10, marginBottom: 12 },
  noticeTxt: { fontSize: 8, color: C.mute, textAlign: 'right', lineHeight: 1.6 },
  intro: { fontSize: 9, color: C.mute, textAlign: 'right', lineHeight: 1.7, marginBottom: 12 },
  card: { borderWidth: 1, borderColor: C.line, borderRadius: 5, padding: 10, marginBottom: 10 },
  cardHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  scaleName: { fontSize: 10.5, fontWeight: 700, textAlign: 'right' },
  prov: { fontSize: 7.5, color: C.faint, textAlign: 'right', marginTop: 2, lineHeight: 1.5 },
  badge: { fontSize: 8, fontWeight: 700, color: C.teal, backgroundColor: C.tealBg, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 },
  caution: { fontSize: 7.5, color: C.amber, backgroundColor: C.amberBg, padding: 5, borderRadius: 3, marginTop: 5, textAlign: 'right', lineHeight: 1.6 },
  domainRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 4 },
  domainLbl: { fontSize: 8.5, color: C.mute, textAlign: 'right' },
  domainVal: { fontSize: 8.5, fontWeight: 700 },
  bullet: { flexDirection: 'row-reverse', marginTop: 3 },
  bulletDot: { fontSize: 8.5, color: C.teal, marginLeft: 4 },
  bulletTxt: { fontSize: 8.5, color: C.mute, textAlign: 'right', flex: 1, lineHeight: 1.6 },
  sectionTitle: { fontSize: 11, fontWeight: 700, textAlign: 'right', marginTop: 6, marginBottom: 6 },
  taskCard: { borderWidth: 1, borderColor: C.line, borderRadius: 5, padding: 8, marginBottom: 7, backgroundColor: C.indigoBg },
  taskName: { fontSize: 9.5, fontWeight: 700, textAlign: 'right' },
  taskDomain: { fontSize: 7.5, color: C.faint, textAlign: 'right' },
  taskHead: { fontSize: 10, fontWeight: 700, color: C.indigo, textAlign: 'right', marginTop: 3 },
  footer: { marginTop: 14, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 },
  footRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  sign: { fontSize: 9, fontWeight: 700, textAlign: 'left' },
  pageNum: { position: 'absolute', bottom: 24, left: 40, right: 40, textAlign: 'center', fontSize: 7.5, color: C.faint },
})

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((t, i) => (
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletTxt}>{t}</Text>
        </View>
      ))}
    </>
  )
}

export function ReportPdf({ d }: { d: PdfReportData }) {
  return (
    <Document title={`تقرير تقييم — ${d.childName}`} author="أكاديمية أمين">
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>أكاديمية أمين</Text>
        <Text style={s.tagline}>خدمات متخصصة في التقييم النمائي والتأهيل السلوكي</Text>
        <View style={s.rule} />

        <Text style={s.h1}>تقرير تقييم أولي</Text>
        <Text style={s.meta}>
          {d.childName} · {d.age} سنة{d.gender ? ` · ${d.gender}` : ''}
          {d.parentName ? ` · ولي الأمر: ${d.parentName}` : ''}
        </Text>
        <Text style={s.meta}>تاريخ التقييم: {d.dateLabel}{d.therapistName ? ` · الأخصائي: ${d.therapistName}` : ''}</Text>

        <View style={s.notice}>
          <Text style={s.noticeTxt}>{d.confidentialLabel} — {d.disclaimer}</Text>
        </View>

        <Text style={s.intro}>{d.intro}</Text>

        {d.scales.map((sc, i) => (
          <View key={i} style={s.card} wrap={false}>
            <View style={s.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.scaleName}>{sc.name}</Text>
                <Text style={s.prov}>{sc.provenance}</Text>
              </View>
              <Text style={s.badge}>{sc.severityLabel}</Text>
            </View>
            {sc.ageCaution ? <Text style={s.caution}>⚠ {sc.ageCaution}</Text> : null}
            {sc.domains.map((dm, j) => (
              <View key={j} style={s.domainRow}>
                <Text style={s.domainLbl}>{dm.label}</Text>
                <Text style={s.domainVal}>{dm.score}%</Text>
              </View>
            ))}
            {sc.recommendations.length > 0 ? (
              <View style={{ marginTop: 6 }}>
                <Bullets items={sc.recommendations} />
              </View>
            ) : null}
            {sc.supportiveNote ? <Text style={s.caution}>{sc.supportiveNote}</Text> : null}
          </View>
        ))}

        {d.tasks.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>الأداء المقيس — الذاكرة والانتباه</Text>
            {d.tasks.map((t, i) => (
              <View key={i} style={s.taskCard} wrap={false}>
                <Text style={s.taskName}>{t.labelAr}</Text>
                <Text style={s.taskDomain}>{t.domainAr}</Text>
                <Text style={s.taskHead}>{t.headline}</Text>
                <Bullets items={t.details} />
                {t.caution ? <Text style={s.caution}>⚠ {t.caution}</Text> : null}
              </View>
            ))}
            {d.batterySummary ? <Text style={s.noticeTxt}>{d.batterySummary}</Text> : null}
          </View>
        ) : null}

        {d.redFlags.length > 0 ? (
          <View style={s.card} wrap={false}>
            <Text style={s.scaleName}>نقاط تستدعي انتباهاً خاصاً</Text>
            <Bullets items={d.redFlags} />
          </View>
        ) : null}

        {d.frequency ? (
          <View style={s.card} wrap={false}>
            <Text style={s.scaleName}>وتيرة الجلسات الموصى بها</Text>
            <Text style={[s.bulletTxt, { marginTop: 4 }]}>{d.frequency}</Text>
          </View>
        ) : null}

        {d.actionPlan.length > 0 ? (
          <View style={s.card}>
            <Text style={s.scaleName}>خطة العمل المقترحة</Text>
            <Bullets items={d.actionPlan} />
          </View>
        ) : null}

        {/* Flows at the end of the content — no forced page break needed. */}
        <View style={s.footer} wrap={false}>
          <View style={s.footRow}>
            <View>
              <Text style={{ fontSize: 9, fontWeight: 700, textAlign: 'right' }}>أكاديمية أمين</Text>
              <Text style={[s.prov, { marginTop: 1 }]}>{d.confidentialLabel}</Text>
            </View>
            <View>
              <Text style={[s.prov, { textAlign: 'left' }]}>توقيع الأخصائي المسؤول</Text>
              <Text style={s.sign}>{d.therapistName || '—'}</Text>
            </View>
          </View>
          <Text style={[s.prov, { marginTop: 8 }]}>{d.disclaimer}</Text>
        </View>

        <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}
