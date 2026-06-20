import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser, createSession } from '@/lib/auth'
import { getParent } from '@/lib/db'

export const runtime = 'nodejs'

// Impersonation mints a working session for any parent account — owner-only,
// even though staff can otherwise manage clients.
export async function POST(
  req: NextRequest,
  { params }: { params: { parentId: string } }
) {
  if (!(await isOwnerUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const parent = await getParent(params.parentId)
  if (!parent) {
    return NextResponse.json({ error: 'الولي غير موجود' }, { status: 404 })
  }

  // Create a 2-hour parent session (overrides their existing session if any).
  // Both the cookie's maxAge and the underlying Redis session TTL must match —
  // otherwise the server would keep accepting this token for 30 days.
  const sessionToken = await createSession(parent.id, 'parent', 2 * 3600)

  const res = NextResponse.json({ ok: true, parentName: `${parent.firstName} ${parent.lastName}` })
  res.cookies.set('parent_token', sessionToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   2 * 3600, // 2 hours only
    path:     '/',
  })
  return res
}
