import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getAllExercises, createExercise, deleteAllExercises } from '@/lib/db'
import { DEFAULT_EXERCISES } from '@/lib/exercises-data'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!await verifyAdminSession(token)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const existing = await getAllExercises()
    if (existing.length > 0) {
      const { force } = await req.json().catch(() => ({}))
      if (!force) {
        return NextResponse.json({
          ok: false,
          message: `يوجد ${existing.length} تمرين مسبقاً. استخدم زر "إعادة التحميل الكاملة" لحذف القديم وتحميل ${DEFAULT_EXERCISES.length} تمرين.`,
          count: existing.length,
        })
      }
      // Delete all existing exercises first to avoid duplicates
      await deleteAllExercises()
    }

    const created: string[] = []
    for (const ex of DEFAULT_EXERCISES) {
      const saved = await createExercise(ex)
      created.push(saved.id)
    }

    return NextResponse.json({
      ok: true,
      message: `تم تحميل ${created.length} تمرين بنجاح`,
      count: created.length,
      ids: created,
    })
  } catch (e) {
    console.error('[seed-exercises]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
