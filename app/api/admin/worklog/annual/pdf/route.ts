import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { isOwnerUser } from '@/lib/auth'
import { registerTajawal } from '@/lib/pdf-fonts'
import { todayIn } from '@/lib/worklog'
import { loadAllWork } from '@/lib/worklog-store'
import { AnnualPdf, annualModel } from '@/lib/worklog-annual-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/** The year's report as a PDF. Only the year comes from the page; every figure is computed here from the ledger. */
export async function GET(req: NextRequest) {
  if (!(await isOwnerUser())) return bad('غير مصرح', 401)
  const year = Number(req.nextUrl.searchParams.get('year'))
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return bad('سنة غير صالحة')

  try {
    const data = await loadAllWork()
    const model = annualModel(year, data, data.settings.currency, { sender: data.settings.senderName, today: todayIn(data.settings.timezone) })
    registerTajawal()
    const buf = await renderToBuffer(React.createElement(AnnualPdf, { m: model }) as React.ReactElement<DocumentProps>)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/pdf',
        // ASCII name: some browsers drop an Arabic filename and save «download».
        'Content-Disposition': `attachment; filename="annual-report-${year}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[worklog annual pdf]', err)
    return bad(`تعذّر توليد ملف PDF: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300), 500)
  }
}
