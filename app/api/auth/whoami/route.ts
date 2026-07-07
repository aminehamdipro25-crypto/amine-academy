import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, verifyAdminSession, verifyStaffSession } from '@/lib/auth'

export const runtime = 'nodejs'

// Lightweight session probe for the public landing page.
// Always 200 — { role: null } when logged out, so the client can decide
// which entry button to show without console errors.
export async function GET() {
  try {
    const cookieStore = await cookies()

    if (await verifyAdminSession(cookieStore.get('admin_token')?.value)) {
      return NextResponse.json({ role: 'owner' })
    }
    if (await verifyStaffSession(cookieStore.get('staff_token')?.value)) {
      return NextResponse.json({ role: 'staff' })
    }
    const parent = await verifyToken(cookieStore.get('parent_token')?.value)
    if (parent?.role === 'parent') {
      return NextResponse.json({ role: 'parent' })
    }
    const student = await verifyToken(cookieStore.get('student_token')?.value)
    if (student?.role === 'student') {
      return NextResponse.json({ role: 'student' })
    }
    return NextResponse.json({ role: null })
  } catch {
    return NextResponse.json({ role: null })
  }
}
