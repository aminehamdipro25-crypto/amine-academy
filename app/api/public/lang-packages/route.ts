import { NextResponse } from 'next/server'
import { getLangPackages } from '@/lib/lang-packages-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public: current package catalog with live (owner-set) prices.
export async function GET() {
  try {
    return NextResponse.json({ packages: await getLangPackages() })
  } catch {
    return NextResponse.json({ packages: [] })
  }
}
