import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getLangPackages, setLangPackages } from '@/lib/lang-packages-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: current packages (merged). POST: save price overrides. Owner-only.
export async function GET() {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  return NextResponse.json({ packages: await getLangPackages() })
}

export async function POST(req: NextRequest) {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const list = Array.isArray(body.packages) ? body.packages : []
  const overrides: Record<string, { qar: number; tnd: number; sessions: number }> = {}
  for (const p of list) {
    if (p && typeof p.id === 'string') overrides[p.id] = { qar: Number(p.qar), tnd: Number(p.tnd), sessions: Number(p.sessions) }
  }
  await setLangPackages(overrides)
  return NextResponse.json({ ok: true, packages: await getLangPackages() })
}
