import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getParent, createPasswordResetToken } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { parentId: string } }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !await verifyAdminSession(token)) {
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
