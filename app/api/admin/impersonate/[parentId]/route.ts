import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { createSession } from '@/lib/auth'
import { getParent } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { parentId: string } }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !verifyAdminSession(token)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const parent = await getParent(params.parentId)
  if (!parent) {
    return NextResponse.json({ error: 'الولي غير موجود' }, { status: 404 })
  }

  // Create a 2-hour parent session (overrides their existing session if any)
  const sessionToken = await createSession(parent.id, 'parent')

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
