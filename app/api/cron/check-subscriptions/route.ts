import { NextResponse } from 'next/server'
import { getAllParents, updateParent } from '@/lib/db'
import { safeCompare } from '@/lib/password'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET
    if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
    const provided = req.headers.get('authorization') ?? ''
    if (!safeCompare(provided, `Bearer ${secret}`)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const parents = await getAllParents()
    const now = new Date()
    let expired = 0

    for (const parent of parents) {
      if (
        parent.subscriptionStatus === 'active' &&
        parent.subscriptionExpiry &&
        new Date(parent.subscriptionExpiry) < now
      ) {
        await updateParent(parent.id, { subscriptionStatus: 'expired' })
        expired++
      }
    }

    return NextResponse.json({ ok: true, expired })
  } catch (err) {
    console.error('[cron-subscriptions]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
