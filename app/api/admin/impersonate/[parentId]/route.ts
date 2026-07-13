import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser, createSession, getDashboardActorId } from '@/lib/auth'
import { getParent } from '@/lib/db'
import { audit } from '@/lib/audit'
import { getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// Impersonation mints a working session for any parent account — owner-only,
// even though staff can otherwise manage clients.
export async function POST(req: NextRequest, props: { params: Promise<{ parentId: string }> }) {
  const params = await props.params;
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

  // Impersonation is the single most sensitive admin capability in the app —
  // always log who did it and to whom.
  const actorId = await getDashboardActorId()
  await audit({
    action: 'impersonate',
    actorId: actorId ?? 'owner',
    actorRole: 'owner',
    targetId: parent.id,
    ip: getClientIp(req),
  })

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
