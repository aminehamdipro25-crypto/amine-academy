import { NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getAllLanguageLeads } from '@/lib/language-leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Owner-only: the interest requests captured from the /languages landing.
export async function GET() {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    return NextResponse.json({ leads: await getAllLanguageLeads() })
  } catch (e) {
    console.error('[language-leads GET]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
