import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getStory, updateStory, deleteStory } from '@/lib/db'
import { sanitizeStoryInput } from '@/lib/story-validation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    if (!(await isOwnerUser())) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const existing = await getStory(params.id)
    if (!existing) return NextResponse.json({ error: 'القصة غير موجودة' }, { status: 404 })

    const body = await req.json().catch(() => null)
    // The client always sends full title/pages/questions (not sparse patches),
    // so merging over the existing record and re-validating the whole shape
    // catches a malformed edit before it overwrites good content.
    const merged = { ...existing, ...(body ?? {}) }
    const result = sanitizeStoryInput(merged)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

    const order = typeof (body as { order?: unknown })?.order === 'number'
      ? (body as { order: number }).order
      : existing.order

    const story = await updateStory(params.id, { ...result.data, order })
    return NextResponse.json({ story })
  } catch (err) {
    console.error('[admin-stories-patch]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    if (!(await isOwnerUser())) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    await deleteStory(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin-stories-delete]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
