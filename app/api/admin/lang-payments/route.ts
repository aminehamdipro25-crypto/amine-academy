import { NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getAllLangPayments } from '@/lib/lang-payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  return NextResponse.json({ payments: await getAllLangPayments() })
}
