import { NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getAuditLog } from '@/lib/audit'

export const runtime = 'nodejs'

export async function GET() {
  if (!await isDashboardUser()) {
    return NextResponse.json({ log: [] }, { status: 401 })
  }
  const log = await getAuditLog(200)
  return NextResponse.json({ log })
}
