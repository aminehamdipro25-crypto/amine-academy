import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { isAllowedMapHost, parseMapLink } from '@/lib/worklog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// A shared Google Maps location is usually a short link (maps.app.goo.gl/…)
// that carries no coordinates until it is followed. The browser cannot follow
// it (cross-origin), so the server does — but only through Google's own map
// hosts, hop by hop, so this can never be pointed at an internal address.
const MAX_HOPS = 5

export async function POST(req: NextRequest) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const { url } = (await req.json().catch(() => ({}))) as { url?: string }
  const direct = parseMapLink(String(url || ''))
  if (direct) return NextResponse.json({ location: direct })

  let current = String(url || '').trim()
  if (!isAllowedMapHost(current)) {
    return NextResponse.json({ error: 'الرابط ليس رابط خرائط Google — الصق رابط المشاركة أو الإحداثيات' }, { status: 400 })
  }
  try {
    for (let hop = 0; hop < MAX_HOPS; hop++) {
      const res = await fetch(current, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(6000) })
      const next = res.headers.get('location')
      if (res.status >= 300 && res.status < 400 && next) {
        const abs = new URL(next, current).toString()
        const found = parseMapLink(abs)
        if (found) return NextResponse.json({ location: found })
        if (!isAllowedMapHost(abs)) break
        current = abs
        continue
      }
      if (!res.ok) break
      // Some links land on a page whose HTML carries the coordinates.
      const html = (await res.text()).slice(0, 400_000)
      const m = html.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || html.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/)
      const found = m ? parseMapLink(`${m[1]},${m[2]}`) : null
      if (found) return NextResponse.json({ location: found })
      break
    }
  } catch (e) {
    console.warn('[worklog resolve-link]', (e as Error).message)
  }
  return NextResponse.json(
    { error: 'لم أستطع استخراج الموقع من هذا الرابط — افتحه، ثم انسخ الإحداثيات أو اضغط على الخريطة مباشرة' },
    { status: 422 },
  )
}
