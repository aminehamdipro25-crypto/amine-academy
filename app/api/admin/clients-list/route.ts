import { NextResponse } from 'next/server'
import { isDashboardUser } from '@/lib/auth'
import { getAllParents, getStudentsByParent } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const parents = await getAllParents()
    const clients = await Promise.all(
      parents.map(async p => {
        const students = await getStudentsByParent(p.id)
        const { passwordHash: _, ...safeParent } = p
        return { ...safeParent, students }
      })
    )

    return NextResponse.json({ clients })
  } catch (e) {
    console.error('[admin/clients-list]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
