import { NextRequest, NextResponse } from 'next/server'
import { getStaff } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await getStaff(id)
  if (!s || s.role !== 'language_teacher' || !s.isActive || !s.publicVisible) {
    return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  }
  return NextResponse.json({
    id: s.id, name: s.name, headline: s.headline || '', bio: s.bio || '',
    experienceYears: s.experienceYears ?? null, certifications: s.certifications || '',
    approach: s.approach || '', languages: s.languages || [],
  })
}
