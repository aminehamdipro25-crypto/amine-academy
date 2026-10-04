import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { baseUrl } from '@/lib/base-url'
import { parseGeocodeResults } from '@/lib/worklog'
import { getWorkSettings } from '@/lib/worklog-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Address → map pin, through OpenStreetMap's Nominatim. Called from the
// server, not the browser: Nominatim's usage policy asks for an identifying
// User-Agent (a browser cannot set one), and the dashboard CSP keeps
// connect-src to our own origin. Results are biased to the country of the
// ledger's currency, where the families actually live.
const COUNTRY = { QAR: 'qa', TND: 'tn' } as const

export async function GET(req: NextRequest) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const q = (req.nextUrl.searchParams.get('q') || '').replace(/\s+/g, ' ').trim().slice(0, 200)
  if (q.length < 3) return NextResponse.json({ error: 'اكتب العنوان بتفصيل أكثر' }, { status: 400 })

  const { currency } = await getWorkSettings()
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.search = new URLSearchParams({
    q, format: 'jsonv2', limit: '5', 'accept-language': 'ar,en', countrycodes: COUNTRY[currency],
  }).toString()

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': `AmineAcademy-WorkLog/1.0 (+${baseUrl()})` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.warn('[worklog geocode] upstream', res.status)
      return NextResponse.json({ error: 'خدمة البحث في الخرائط لا تستجيب الآن — اضغط على الخريطة مباشرة أو الصق رابط الموقع' }, { status: 502 })
    }
    return NextResponse.json({ results: parseGeocodeResults(await res.json()) })
  } catch (e) {
    console.warn('[worklog geocode]', (e as Error).message)
    return NextResponse.json({ error: 'تعذّر الوصول إلى خدمة البحث في الخرائط — اضغط على الخريطة مباشرة أو الصق رابط الموقع' }, { status: 502 })
  }
}
