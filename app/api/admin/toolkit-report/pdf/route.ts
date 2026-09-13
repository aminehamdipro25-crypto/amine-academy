import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import React from 'react'
import { Font, renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { isDashboardUser } from '@/lib/auth'
import { ReportPdf, type PdfReportData } from '@/lib/report-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Rendering a multi-page PDF is heavier than a normal route.
export const maxDuration = 30

// Register once per warm lambda, not per request.
let fontsReady = false
function registerFonts() {
  if (fontsReady) return
  const dir = path.join(process.cwd(), 'public', 'fonts')
  Font.register({
    family: 'Tajawal',
    fonts: [
      { src: path.join(dir, 'Tajawal-Regular.ttf'), fontWeight: 400 },
      { src: path.join(dir, 'Tajawal-Bold.ttf'), fontWeight: 700 },
    ],
  })
  // react-pdf hyphenates Latin words by default, which mangles Arabic.
  Font.registerHyphenationCallback(word => [word])
  fontsReady = true
}

function str(v: unknown, max = 400): string {
  return typeof v === 'string' ? v.slice(0, max) : ''
}
function strList(v: unknown, maxItems = 40): string[] {
  return Array.isArray(v) ? v.slice(0, maxItems).map(x => str(x)).filter(Boolean) : []
}

/**
 * Render the specialist toolkit report to a PDF.
 *
 * The client sends the already-computed, already-translated report content so
 * this route stays a pure renderer — it does not re-derive any clinical figure,
 * which keeps the PDF and the on-screen report incapable of disagreeing.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isDashboardUser())) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    const data: PdfReportData = {
      childName: str(body.childName, 120) || 'الطفل',
      age: str(body.age, 10),
      gender: str(body.gender, 30),
      parentName: str(body.parentName, 120),
      therapistName: str(body.therapistName, 120),
      dateLabel: str(body.dateLabel, 60),
      intro: str(body.intro, 1200),
      confidentialLabel: str(body.confidentialLabel, 200),
      disclaimer: str(body.disclaimer, 600),
      scales: Array.isArray(body.scales) ? body.scales.slice(0, 10).map((sc: Record<string, unknown>) => ({
        name: str(sc?.name, 160),
        provenance: str(sc?.provenance, 400),
        severityLabel: str(sc?.severityLabel, 40),
        ageCaution: str(sc?.ageCaution, 600) || undefined,
        domains: Array.isArray(sc?.domains) ? (sc.domains as Record<string, unknown>[]).slice(0, 20).map(d => ({
          label: str(d?.label, 80),
          score: Number(d?.score) || 0,
        })) : [],
        recommendations: strList(sc?.recommendations),
        supportiveNote: str(sc?.supportiveNote, 400) || undefined,
      })) : [],
      tasks: Array.isArray(body.tasks) ? body.tasks.slice(0, 12).map((t: Record<string, unknown>) => ({
        labelAr: str(t?.labelAr, 80),
        domainAr: str(t?.domainAr, 120),
        headline: str(t?.headline, 200),
        details: strList(t?.details, 10),
        caution: str(t?.caution, 400) || undefined,
      })) : [],
      batterySummary: str(body.batterySummary, 600) || undefined,
      frequency: str(body.frequency, 400) || undefined,
      actionPlan: strList(body.actionPlan),
      redFlags: strList(body.redFlags, 12),
    }

    registerFonts()
    // ReportPdf renders a <Document>; React's element type doesn't carry that
    // through a custom component, so restate it for renderToBuffer.
    const el = React.createElement(ReportPdf, { d: data }) as React.ReactElement<DocumentProps>
    const buf = await renderToBuffer(el)

    const safeName = (data.childName || 'report').replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim() || 'report'
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`تقرير-${safeName}.pdf`)}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[toolkit-report-pdf]', err)
    return NextResponse.json({ error: 'تعذّر توليد ملف PDF' }, { status: 500 })
  }
}
