import { NextResponse } from 'next/server'
import { getDashboardActorId } from '@/lib/auth'
import { getAllBookings } from '@/lib/language-bookings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: bookings for this actor — owner sees all, a teacher sees only theirs.
export async function GET() {
  const actor = await getDashboardActorId()
  if (!actor) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const all = await getAllBookings()
  if (actor === 'owner') return NextResponse.json({ bookings: all })
  const sid = actor.startsWith('staff:') ? actor.slice(6) : null
  return NextResponse.json({ bookings: all.filter(b => b.teacherId === sid) })
}
