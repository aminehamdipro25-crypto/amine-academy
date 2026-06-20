import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getAllExercises, createExercise, deleteAllExercises } from '@/lib/db'
import { DEFAULT_EXERCISES } from '@/lib/exercises-data'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Wiping and reseeding the entire shared exercise catalog is a global,
    // destructive, platform-wide action — owner-only even though the
    // Exercises page itself is staff-accessible.
    if (!await isOwnerUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Parse body FIRST before any other async operations
    const { force } = await req.json().catch(() => ({ force: false }))

    const existing = await getAllExercises()
    if (existing.length > 0 && !force) {
      return NextResponse.json({
        ok: false,
        message: `يوجد ${existing.length} تمرين مسبقاً. استخدم زر "إعادة التحميل الكاملة" لحذف القديم وتحميل ${DEFAULT_EXERCISES.length} تمرين.`,
        count: existing.length,
      })
    }

    if (existing.length > 0 && force) {
      const deleted = await deleteAllExercises()
      console.log(`[seed-exercises] deleted ${deleted} exercises`)
    }

    const created: string[] = []
    for (const ex of DEFAULT_EXERCISES) {
      const saved = await createExercise(ex)
      created.push(saved.id)
    }

    return NextResponse.json({
      ok: true,
      message: `تم تحميل ${created.length} تمرين بنجاح — تم حذف ${existing.length} تمرين قديم`,
      count: created.length,
      ids: created,
    })
  } catch (e) {
    console.error('[seed-exercises]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
