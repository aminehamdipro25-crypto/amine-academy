import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { Font, renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { isOwnerUser } from '@/lib/auth'
import { TAJAWAL_BOLD, TAJAWAL_REGULAR } from '@/lib/fonts-tajawal'
import { buildStatement, todayIn } from '@/lib/worklog'
import { loadAllWork } from '@/lib/worklog-store'
import { StatementPdf, statementPdfModel } from '@/lib/worklog-statement-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Same registration as the toolkit report: data URIs (a file path fails on
// Vercel), and no hyphenation, which mangles Arabic words.
let fontsReady = false
function registerFonts() {
  if (fontsReady) return
  Font.register({ family: 'Tajawal', fonts: [{ src: TAJAWAL_REGULAR, fontWeight: 400 }, { src: TAJAWAL_BOLD, fontWeight: 700 }] })
  Font.registerHyphenationCallback(word => [word])
  fontsReady = true
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/**
 * The account statement as a PDF. Only the family and the period come from the
 * page: every figure is recomputed here from the stored ledger, with the same
 * buildStatement the WhatsApp text uses — so the two can never disagree.
 */
export async function GET(req: NextRequest) {
  if (!(await isOwnerUser())) return bad('غير مصرح', 401)
  const q = req.nextUrl.searchParams
  const clientId = q.get('client') ?? ''
  let from = q.get('from') ?? ''
  let to = q.get('to') ?? ''
  if (!clientId || !DAY.test(from) || !DAY.test(to)) return bad('طلب غير صالح')
  if (from > to) [from, to] = [to, from]

  try {
    const { clients, lessons, payments, settings } = await loadAllWork()
    const client = clients.find(c => c.id === clientId)
    if (!client) return bad('العائلة غير موجودة', 404)

    const today = todayIn(settings.timezone)
    const st = buildStatement(client.id, lessons, payments, from, to, today)
    const model = statementPdfModel(st, client, settings.currency, { sender: settings.senderName, today })

    registerFonts()
    const el = React.createElement(StatementPdf, { m: model }) as React.ReactElement<DocumentProps>
    const buf = await renderToBuffer(el)

    // ASCII name: some browsers drop an Arabic filename and save «download».
    const name = `statement-${model.reference}.pdf`
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[worklog statement pdf]', err)
    return bad(`تعذّر توليد ملف PDF: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300), 500)
  }
}
