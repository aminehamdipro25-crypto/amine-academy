import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getAssessmentProfile, saveAssessmentProfile } from '@/lib/db'
import { z } from 'zod'

export const runtime = 'nodejs'

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return verifyAdminSession(token || '')
}

const DifficultyLevelSchema = z.enum(['none', 'mild', 'moderate', 'severe'])

const ProfileUpdateSchema = z.object({
  diagnosedDifficulties: z.object({
    attentionDeficit:  DifficultyLevelSchema,
    impulsivity:       DifficultyLevelSchema,
    workingMemory:     DifficultyLevelSchema,
    processingSpeed:   DifficultyLevelSchema,
    dyslexia:          DifficultyLevelSchema,
    dyscalculia:       DifficultyLevelSchema,
    socialCognition:   DifficultyLevelSchema,
    motorCoordination: DifficultyLevelSchema,
  }).partial().optional(),
  recommendedGames:     z.array(z.string()).optional(),
  contraindicatedGames: z.array(z.string()).optional(),
  defaultDifficulty:    z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  clinicalNotes:        z.string().max(5000).optional(),
  lastAssessmentId:     z.string().nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const profile = await getAssessmentProfile(params.studentId)
  return NextResponse.json({ profile })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = await req.json()
    const parsed = ProfileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: parsed.error.flatten() }, { status: 400 })
    }
    const profile = await saveAssessmentProfile(
      params.studentId,
      parsed.data as Parameters<typeof saveAssessmentProfile>[1]
    )
    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json({ error: 'خطأ في الحفظ' }, { status: 500 })
  }
}
