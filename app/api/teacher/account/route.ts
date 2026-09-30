import { NextRequest, NextResponse } from 'next/server'
import { getDashboardActorId } from '@/lib/auth'
import { getStaff, updateStaff } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import type { Staff } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function selfStaffId(): Promise<string | null> {
  const actor = await getDashboardActorId()
  return actor && actor.startsWith('staff:') ? actor.slice(6) : null
}

// GET: the teacher's own profile (safe).
export async function GET() {
  const id = await selfStaffId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const staff = await getStaff(id)
  if (!staff) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  const { passwordHash, ...safe } = staff
  return NextResponse.json(safe)
}

// PATCH: the teacher edits their OWN password + public portfolio fields only.
// Rate / share / languages stay owner-controlled and are ignored here.
export async function PATCH(req: NextRequest) {
  const id = await selfStaffId()
  if (!id) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const staff = await getStaff(id)
  if (!staff) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const updates: Partial<Staff> = {}
  if (typeof body.password === 'string' && body.password) {
    if (body.password.length < 8) return NextResponse.json({ error: 'كلمة المرور قصيرة جداً (8 أحرف على الأقل)' }, { status: 400 })
    updates.passwordHash = hashPassword(body.password)
  }
  if (typeof body.bio === 'string') updates.bio = body.bio.trim().slice(0, 600)
  if (typeof body.headline === 'string') updates.headline = body.headline.trim().slice(0, 120)
  if (typeof body.certifications === 'string') updates.certifications = body.certifications.trim().slice(0, 400)
  if (typeof body.approach === 'string') updates.approach = body.approach.trim().slice(0, 600)
  if (body.experienceYears !== undefined && body.experienceYears !== '' && Number.isFinite(Number(body.experienceYears))) {
    updates.experienceYears = Math.max(0, Math.min(70, Math.round(Number(body.experienceYears))))
  }
  if (typeof body.publicVisible === 'boolean') updates.publicVisible = body.publicVisible

  await updateStaff(id, updates)
  return NextResponse.json({ ok: true })
}
