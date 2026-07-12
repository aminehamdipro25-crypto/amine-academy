import { NextResponse } from 'next/server'
import { getAllStories } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Public read of the story library — reading a children's story catalogue
// isn't sensitive, and this is fetched from three different audiences (the
// specialist's session page, the child's session page, and the parent
// portal), none of which share one auth cookie. Mutations stay owner-gated
// under /api/admin/stories/*.
export async function GET() {
  try {
    const stories = await getAllStories()
    return NextResponse.json({ stories })
  } catch (err) {
    console.error('[stories-get]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
