import type { Staff, StaffRole } from '@/lib/types'

export const ALLOWED_TEACHING_LANGUAGES = ['french', 'english', 'arabic', 'spanish', 'german', 'italian']

// Pull the optional teacher/provider fields (role, languages, rate, profit share,
// bio) out of a request body, validated and normalised. Shared by the staff
// create (POST) and edit (PATCH) admin endpoints so both stay in sync.
export function sanitizeTeacherFields(body: Record<string, unknown>): Partial<Staff> {
  const out: Partial<Staff> = {}
  if (body.role === 'therapist' || body.role === 'language_teacher') out.role = body.role as StaffRole
  if (Array.isArray(body.languages)) {
    out.languages = (body.languages as unknown[])
      .filter((l): l is string => typeof l === 'string' && ALLOWED_TEACHING_LANGUAGES.includes(l))
  }
  if (typeof body.bio === 'string') out.bio = body.bio.trim().slice(0, 600)
  if (body.hourlyRate !== undefined && body.hourlyRate !== null && body.hourlyRate !== '') {
    const r = Number(body.hourlyRate)
    if (Number.isFinite(r) && r >= 0 && r <= 100000) out.hourlyRate = Math.round(r)
  }
  if (body.currency === 'QAR' || body.currency === 'TND') out.currency = body.currency
  if (body.teacherSharePct !== undefined && body.teacherSharePct !== null && body.teacherSharePct !== '') {
    const p = Number(body.teacherSharePct)
    if (Number.isFinite(p) && p >= 0 && p <= 100) out.teacherSharePct = Math.round(p)
  }
  return out
}
