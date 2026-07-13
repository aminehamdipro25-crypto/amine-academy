import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getParent, createPasswordResetToken } from '@/lib/db'

export const runtime = 'nodejs'

// Returns a live password-reset link for the parent account — owner-only,
// since this is equivalent to an account takeover if handed to staff.
export async function POST(req: NextRequest, props: { params: Promise<{ parentId: string }> }) {
  const params = await props.params;
  if (!(await isOwnerUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const parent = await getParent(params.parentId)
  if (!parent) {
    return NextResponse.json({ error: 'الولي غير موجود' }, { status: 404 })
  }

  const resetToken = await createPasswordResetToken(parent.email)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amine-academy.vercel.app'
  const resetUrl = `${baseUrl}/parent/reset-password?token=${resetToken}&email=${encodeURIComponent(parent.email)}`
  const whatsappPhone = (parent.phone || '').replace(/[^0-9]/g, '')

  return NextResponse.json({
    ok: true,
    resetUrl,
    parentName: `${parent.firstName} ${parent.lastName}`,
    parentEmail: parent.email,
    whatsappPhone,
  })
}
