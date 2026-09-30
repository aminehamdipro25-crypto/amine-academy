import { NextResponse } from 'next/server'
import { getAllStaff } from '@/lib/db'
import { getTeacherRatings } from '@/lib/teacher-ratings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public: REAL learner reviews (with comments) aggregated across visible teachers.
// Never fabricated — if there are none yet, returns an empty list.
export async function GET() {
  try {
    const teachers = (await getAllStaff()).filter(s => s.role === 'language_teacher' && s.isActive && s.publicVisible)
    const all: { name: string; stars: number; comment: string; teacher: string; at: string }[] = []
    for (const t of teachers) {
      const ratings = await getTeacherRatings(t.id)
      for (const r of ratings) if (r.comment) all.push({ name: r.learnerName, stars: r.stars, comment: r.comment, teacher: t.name, at: r.at })
    }
    all.sort((a, b) => (a.at < b.at ? 1 : -1))
    return NextResponse.json({ testimonials: all.slice(0, 9).map(({ at, ...t }) => t) })
  } catch {
    return NextResponse.json({ testimonials: [] })
  }
}
