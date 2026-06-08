import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

type Currency = 'QAR' | 'TND'

const COUNTRY_CURRENCY_MAP: Record<string, Currency> = {
  QA: 'QAR',
  TN: 'TND',
}

export async function GET(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country') ?? 'QA'
  const currency: Currency = COUNTRY_CURRENCY_MAP[country] ?? 'QAR'

  return NextResponse.json({ country, currency })
}
