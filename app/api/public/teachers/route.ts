import { NextResponse } from 'next/server'
import { getAllStaff } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public: the language teachers who chose to be listed. Only safe portfolio
// fields are exposed — never email, rate, or revenue share.
export async function GET() {
  try {
    const staff = await getAllStaff()
    const teachers = staff
      .filter(s => s.role === 'language_teacher' && s.isActive && s.publicVisible)
      .map(s => ({
        id: s.id, name: s.name, headline: s.headline || '', bio: s.bio || '',
        experienceYears: s.experienceYears ?? null, certifications: s.certifications || '',
        approach: s.approach || '', languages: s.languages || [],
      }))
    return NextResponse.json({ teachers })
  } catch (e) {
    console.error('[public/teachers]', e)
    return NextResponse.json({ teachers: [] })
  }
}
