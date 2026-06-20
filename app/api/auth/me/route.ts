import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession, verifyStaffSession } from '@/lib/auth'
import { getStaff } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const cookieStore = await cookies()

  if (await verifyAdminSession(cookieStore.get('admin_token')?.value)) {
    return NextResponse.json({ role: 'owner', name: 'الأستاذ أمين' })
  }

  const staffSession = await verifyStaffSession(cookieStore.get('staff_token')?.value)
  if (staffSession) {
    const staff = await getStaff(staffSession.staffId)
    if (staff?.isActive) {
      return NextResponse.json({ role: 'staff', name: staff.name, staffId: staff.id })
    }
  }

  return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
}
