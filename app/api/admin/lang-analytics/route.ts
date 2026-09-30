import { NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { getAllStaff } from '@/lib/db'
import { getAllLearners } from '@/lib/language-learners'
import { getAllTeachingSessions } from '@/lib/teaching-sessions'
import { getAllBookings } from '@/lib/language-bookings'
import { getAllLanguageLeads } from '@/lib/language-leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Owner-only KPI roll-up for the languages track.
export async function GET() {
  if (!(await isOwnerUser())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const [staff, learners, sessions, bookings, leads] = await Promise.all([
      getAllStaff(), getAllLearners(), getAllTeachingSessions(), getAllBookings(), getAllLanguageLeads(),
    ])
    const teachers = staff.filter(s => s.role === 'language_teacher')
    const teacherName = new Map(teachers.map(t => [t.id, t.name]))
    const month = new Date().toISOString().slice(0, 7)
    const monthly = sessions.filter(s => s.dateISO.startsWith(month))

    // Revenue by currency (this month)
    const byCur: Record<string, { gross: number; teacher: number; academy: number; hours: number; count: number }> = {}
    for (const s of monthly) {
      const c = (byCur[s.currency] ||= { gross: 0, teacher: 0, academy: 0, hours: 0, count: 0 })
      c.gross += s.price; c.teacher += s.teacherEarn; c.academy += s.academyEarn; c.hours += s.durationHours; c.count++
    }

    // Per-teacher utilisation (this month)
    const perTeacher: Record<string, { name: string; hours: number; count: number; academy: number; currency: string }> = {}
    for (const s of monthly) {
      const t = (perTeacher[s.teacherId] ||= { name: s.teacherName || teacherName.get(s.teacherId) || '—', hours: 0, count: 0, academy: 0, currency: s.currency })
      t.hours += s.durationHours; t.count++; t.academy += s.academyEarn
    }

    // Level distribution
    const levels: Record<string, number> = {}
    for (const l of learners) levels[l.level || 'unknown'] = (levels[l.level || 'unknown'] || 0) + 1

    const activeLearners = learners.filter(l => l.fit === 'accepted' || sessions.some(s => s.learnerId === l.id)).length

    return NextResponse.json({
      month,
      totals: {
        learners: learners.length,
        activeLearners,
        teachers: teachers.length,
        leadsNew: leads.filter(l => l.status !== 'converted').length,
        leadsConverted: leads.filter(l => l.status === 'converted').length,
        pendingBookings: bookings.filter(b => b.status === 'requested').length,
      },
      byCurrency: byCur,
      perTeacher: Object.values(perTeacher).sort((a, b) => b.academy - a.academy),
      levels,
    })
  } catch (e) {
    console.error('[lang-analytics]', e)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
