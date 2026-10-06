import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { isOwnerUser } from '@/lib/auth'
import { registerTajawal } from '@/lib/pdf-fonts'
import { AVAILABILITY_DEFAULT, sanitizeSettings, todayIn, wallClockIn } from '@/lib/worklog'
import { freeSlots } from '@/lib/worklog-planning'
import { loadAllWork } from '@/lib/worklog-store'
import { AvailabilityPdf, availabilityPdfModel } from '@/lib/worklog-availability-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
const DAY = /^\d{4}-\d{2}-\d{2}$/

/**
 * The free times as a PDF for a family. The page sends only its choices
 * (family, length, how many days, hours being tried, days left out); the
 * times themselves are recomputed here from the agenda.
 */
export async function POST(req: NextRequest) {
  if (!(await isOwnerUser())) return bad('غير مصرح', 401)
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return bad('طلب غير صالح')
  const durationMin = Number(body.durationMin)
  const span = Number(body.days)
  if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 300) return bad('مدة غير صالحة')
  if (![7, 14].includes(span)) return bad('فترة غير صالحة')
  const exclude = new Set(Array.isArray(body.exclude) ? body.exclude.filter((d): d is string => typeof d === 'string' && DAY.test(d)) : [])

  try {
    const { clients, lessons, settings } = await loadAllWork()
    // Hours being tried in the sheet but not saved yet are validated like a save would be.
    let availability = settings.availability ?? AVAILABILITY_DEFAULT
    if (body.availability) {
      const v = sanitizeSettings({ availability: body.availability }, settings)
      if (!v.ok) return bad(v.error)
      availability = v.value.availability!
    }
    const clientId = typeof body.clientId === 'string' && body.clientId ? body.clientId : undefined
    const client = clientId ? clients.find(c => c.id === clientId) : undefined
    if (clientId && !client) return bad('العائلة غير موجودة', 404)

    const today = todayIn(settings.timezone)
    const now = wallClockIn(settings.timezone)
    const byId = new Map(clients.map(c => [c.id, c]))
    const days = freeSlots(lessons, {
      from: today, days: span, durationMin, availability, clientId,
      locate: id => byId.get(id)?.location, today, nowMin: now.getHours() * 60 + now.getMinutes(),
    }).filter(d => !exclude.has(d.date))

    const model = availabilityPdfModel(days, { family: client?.name, durationMin, sender: settings.senderName, today })
    registerTajawal()
    const buf = await renderToBuffer(React.createElement(AvailabilityPdf, { m: model }) as React.ReactElement<DocumentProps>)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/pdf',
        // ASCII name: some browsers drop an Arabic filename and save «download».
        'Content-Disposition': `attachment; filename="available-times-${today}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[worklog availability pdf]', err)
    return bad(`تعذّر توليد ملف PDF: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300), 500)
  }
}
