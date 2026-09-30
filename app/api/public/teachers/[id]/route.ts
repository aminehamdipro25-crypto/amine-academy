import { NextRequest, NextResponse } from 'next/server'
import { getStaff } from '@/lib/db'
import { getTeacherRatings, summarize } from '@/lib/teacher-ratings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await getStaff(id)
  if (!s || s.role !== 'language_teacher' || !s.isActive || !s.publicVisible) {
    return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  }
  const ratings = await getTeacherRatings(id)
  const { avg, count } = summarize(ratings)
  return NextResponse.json({
    id: s.id, name: s.name, headline: s.headline || '', bio: s.bio || '',
    experienceYears: s.experienceYears ?? null, certifications: s.certifications || '',
    approach: s.approach || '', languages: s.languages || [],
    rating: avg, ratingCount: count,
    reviews: ratings.filter(r => r.comment).slice(0, 12).map(r => ({ stars: r.stars, comment: r.comment, name: r.learnerName })),
  })
}
