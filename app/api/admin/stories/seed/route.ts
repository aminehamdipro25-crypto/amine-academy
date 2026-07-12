import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getAllStories, createStoryWithId, deleteAllStories } from '@/lib/db'
import { DEFAULT_STORIES } from '@/lib/stories-data'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Wiping and reseeding the shared story catalogue is global and
    // destructive (force mode deletes every specialist-authored edit) —
    // owner-only, same as exercises seeding.
    if (!await isOwnerUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { force } = await req.json().catch(() => ({ force: false }))
    const existing = await getAllStories()

    if (existing.length > 0 && !force) {
      return NextResponse.json({
        ok: false,
        message: `يوجد ${existing.length} قصة مسبقاً. استخدم "إعادة التحميل الكاملة" لحذف كل شيء (بما فيه تعديلاتك) وتحميل ${DEFAULT_STORIES.length} قصة افتراضية.`,
        count: existing.length,
      })
    }

    if (existing.length > 0 && force) {
      const deleted = await deleteAllStories()
      console.log(`[seed-stories] deleted ${deleted} stories`)
    }

    const created: string[] = []
    for (const s of DEFAULT_STORIES) {
      await createStoryWithId(s)
      created.push(s.id)
    }

    return NextResponse.json({
      ok: true,
      message: `تم تحميل ${created.length} قصة بنجاح`,
      count: created.length,
      ids: created,
    })
  } catch (e) {
    console.error('[seed-stories]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
