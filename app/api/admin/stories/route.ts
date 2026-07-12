import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { createStory, getAllStories } from '@/lib/db'
import { sanitizeStoryInput } from '@/lib/story-validation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Listing is public — GET /api/stories (read by the dashboard's own story
// grid too, since it's the same content). This route only handles creation.
export async function POST(req: NextRequest) {
  try {
    if (!await isOwnerUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const body = await req.json().catch(() => null)
    // Kept un-destructured — destructuring `sanitizeStoryInput`'s discriminated
    // union return breaks TS's ability to narrow `data` after checking `error`.
    const result = sanitizeStoryInput(body)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

    const existing = await getAllStories()
    const order = typeof (body as { order?: unknown })?.order === 'number'
      ? (body as { order: number }).order
      : existing.length

    const story = await createStory({ ...result.data, order })
    return NextResponse.json({ story }, { status: 201 })
  } catch (err) {
    console.error('[admin-stories-post]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
