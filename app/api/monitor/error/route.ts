import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser, verifyToken } from '@/lib/auth'
import { logError, getErrors } from '@/lib/error-monitor'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// POST — receive client-side errors (authenticated users only, or allow open for unauth errors)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Try to get user identity
    let userId: string | undefined
    let role: string | undefined
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value ?? cookieStore.get('admin_token')?.value
    if (token) {
      const payload = await verifyToken(token)
      if (payload) { userId = payload.id; role = payload.role }
    }
    await logError({
      message:   String(body?.message   ?? 'Unknown error').slice(0, 500),
      stack:     body?.stack    ? String(body.stack).slice(0, 2000)    : undefined,
      url:       body?.url      ? String(body.url).slice(0, 300)       : undefined,
      userAgent: body?.userAgent ? String(body.userAgent).slice(0, 200) : undefined,
      userId,
      role,
      level: body?.level === 'warning' ? 'warning' : 'error',
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

// GET — admin only, retrieve error log
export async function GET() {
  if (!await isDashboardUser()) {
    return NextResponse.json({ errors: [] }, { status: 401 })
  }
  const errors = await getErrors(100)
  return NextResponse.json({ errors })
}
