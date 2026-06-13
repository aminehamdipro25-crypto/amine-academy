import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getSiteSettings, updateSiteSettings } from '@/lib/site-settings'

export const runtime = 'nodejs'

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return verifyAdminSession(token)
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const settings = await getSiteSettings()
    return NextResponse.json(settings)
  } catch (e) {
    console.error('[admin/settings GET]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }
    const updated = await updateSiteSettings(body)
    return NextResponse.json(updated)
  } catch (e) {
    console.error('[admin/settings PATCH]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
