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

    const { force, addNew } = await req.json().catch(() => ({ force: false, addNew: false }))
    const existing = await getAllStories()

    // Non-destructive enrichment: add ONLY default stories whose id is not
    // already present, keeping every existing (specialist-edited) story.
    // Lets the owner pull in newly-shipped stories without wiping their work.
    if (addNew && !force) {
      const existingIds = new Set(existing.map(s => s.id))
      const missing = DEFAULT_STORIES.filter(s => !existingIds.has(s.id))
      if (missing.length === 0) {
        return NextResponse.json({
          ok: true,
          added: 0,
          message: 'كل القصص الجديدة موجودة مسبقاً — لا جديد لإضافته.',
          count: existing.length,
        })
      }
      // Append after the current maximum order so the new stories land last.
      let order = existing.reduce((mx, s) => Math.max(mx, s.order ?? 0), -1) + 1
      const added: string[] = []
      for (const s of missing) {
        await createStoryWithId({ ...s, order: order++, createdAt: new Date().toISOString() })
        added.push(s.id)
      }
      return NextResponse.json({
        ok: true,
        added: added.length,
        message: `تمت إضافة ${added.length} قصة جديدة دون المساس بقصصك الحالية.`,
        count: existing.length + added.length,
        ids: added,
      })
    }

    if (existing.length > 0 && !force) {
      return NextResponse.json({
        ok: false,
        message: `يوجد ${existing.length} قصة مسبقاً. استخدم "إضافة القصص الجديدة فقط" للإضافة دون حذف، أو "إعادة التحميل الكاملة" لحذف كل شيء (بما فيه تعديلاتك) وتحميل ${DEFAULT_STORIES.length} قصة افتراضية.`,
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
