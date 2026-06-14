import { NextResponse } from 'next/server'
import { getSiteSettings } from '@/lib/site-settings'

export const runtime = 'nodejs'
export const revalidate = 60

export async function GET() {
  try {
    const settings = await getSiteSettings()
    // Return only public-safe fields (no sensitive data)
    const { prices, discountPct, discountLabel, offerDurationDays, stats, sessionsPerWeek, sessionsPerMonth } = settings
    return NextResponse.json(
      { prices, discountPct, discountLabel, offerDurationDays, stats, sessionsPerWeek, sessionsPerMonth },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (e) {
    console.error('[public/settings GET]', e)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
