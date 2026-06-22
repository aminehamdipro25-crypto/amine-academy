import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser, getDashboardActorId } from '@/lib/auth'
import { getStudent, getAllExercises } from '@/lib/db'
import { redis } from '@/lib/redis'
import Anthropic from '@anthropic-ai/sdk'
import type { AssessmentResult, AgeGroup, Diagnosis } from '@/lib/types'

const VALID_AGE_GROUPS: AgeGroup[] = ['5-11', '12-17', '18-22']
const VALID_DIAGNOSES: Diagnosis[] = ['ADHD', 'AUTISM', 'ADHD+AUTISM', 'OTHER']

export const runtime = 'nodejs'

const DIAG_AR: Record<string, string> = {
  ADHD: 'اضطراب ADHD (فرط الحركة وتشتت الانتباه)',
  AUTISM: 'طيف التوحد (ASD)',
  'ADHD+AUTISM': 'ADHD مع طيف التوحد',
  OTHER: 'تشخيص آخر',
}
const AGE_AR: Record<string, string> = { '5-11': '5-11 سنوات', '12-17': '12-17 سنوات', '18-22': '18-22 سنوات' }
const SEV_AR: Record<number, string> = { 1: 'خفيف', 2: 'متوسط', 3: 'شديد' }
const SENS_AR: Record<string, string> = { low: 'منخفضة', medium: 'متوسطة', high: 'مرتفعة' }
const SEV_LABEL: Record<string, string> = { none: 'لا يوجد', mild: 'خفيف', moderate: 'متوسط', severe: 'شديد' }
const CAT_AR: Record<string, string> = {
  motor: 'حركي', focus: 'تركيز وانتباه', balance: 'توازن', energy: 'طاقة', sensory: 'حسي', social: 'اجتماعي'
}

async function getStudentAssessments(studentId: string): Promise<AssessmentResult[]> {
  try {
    const ids = await redis.lrange(`assessments:student:${studentId}`, 0, 5)
    const results = await Promise.all(ids.map(id => redis.get<AssessmentResult>(`assessment:${id}`)))
    return results.filter(Boolean) as AssessmentResult[]
  } catch {
    return []
  }
}

function formatAssessmentsForPrompt(assessments: AssessmentResult[]): string {
  if (assessments.length === 0) return 'لا توجد تقييمات مسجّلة بعد.'
  const lines: string[] = []
  for (const a of assessments) {
    const typeLabel = a.type === 'adhd' ? 'تقييم ADHD' : a.type === 'autism' ? 'تقييم طيف التوحد' : `تقييم ${a.type}`
    lines.push(`\n### ${typeLabel} (${new Date(a.createdAt).toLocaleDateString('fr-FR')})`)
    lines.push(`- الدرجة الإجمالية: ${a.totalScore} | الشدة: ${SEV_LABEL[a.severity] || a.severity}`)
    if (Object.keys(a.domainScores).length > 0) {
      lines.push('- النتائج حسب المجال:')
      for (const [domain, score] of Object.entries(a.domainScores)) {
        lines.push(`  • ${domain}: ${score}`)
      }
    }
    if (a.recommendations.length > 0) {
      lines.push('- التوصيات:')
      a.recommendations.slice(0, 3).forEach(r => lines.push(`  → ${r}`))
    }
  }
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'مفتاح AI غير مُعدّ في المتغيرات البيئية' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const { studentId } = body

    // Linked: re-derive the full profile + assessment history from the real student record.
    // Unlinked walk-in: there's no record — use the best-effort profile + in-session results
    // the client sent instead, so the toolkit stays usable end-to-end without forcing a link.
    let fullName: string
    let ageGroup: AgeGroup
    let diagnosis: Diagnosis
    let severityLevel: 1 | 2 | 3
    let sensoryLabels: { visual: string; audio: string; touch: string }
    let assessments: AssessmentResult[]

    if (studentId) {
      const student = await getStudent(studentId)
      if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
      fullName = `${student.firstName} ${student.lastName}`.trim()
      ageGroup = student.ageGroup
      diagnosis = student.diagnosis
      severityLevel = student.severityLevel
      sensoryLabels = {
        visual: SENS_AR[student.sensoryProfile.visualSensitivity],
        audio: SENS_AR[student.sensoryProfile.audioSensitivity],
        touch: SENS_AR[student.sensoryProfile.touchSensitivity],
      }
      assessments = await getStudentAssessments(studentId)
    } else {
      const { profile, assessments: inlineAssessments } = body
      if (!profile || !VALID_AGE_GROUPS.includes(profile.ageGroup) || !VALID_DIAGNOSES.includes(profile.diagnosis)) {
        return NextResponse.json({ error: 'studentId أو بيانات الطفل (profile) مطلوبة' }, { status: 400 })
      }
      fullName = typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim() : 'الطفل'
      ageGroup = profile.ageGroup
      diagnosis = profile.diagnosis
      severityLevel = [1, 2, 3].includes(profile.severityLevel) ? profile.severityLevel : 2
      // No formal sensory profile is collected for an unlinked walk-in — assume medium across the board
      sensoryLabels = { visual: SENS_AR.medium, audio: SENS_AR.medium, touch: SENS_AR.medium }
      assessments = Array.isArray(inlineAssessments) ? inlineAssessments.slice(0, 6) : []
    }

    const allExercises = await getAllExercises()

    // Filter exercises relevant to this child
    const relevant = allExercises.filter(ex =>
      ex.ageGroups.includes(ageGroup) &&
      (ex.diagnoses.includes(diagnosis) || ex.diagnoses.includes('OTHER') ||
       ex.diagnoses.length === 0)
    )

    const exList = relevant.map(ex =>
      `• ID: ${ex.id} | ${ex.titleAr || ex.title} | فئة: ${CAT_AR[ex.category] || ex.category} | مستوى: ${ex.difficulty} | مدة: ${ex.durationMinutes} دقيقة | نقاط: ${ex.points}`
    ).join('\n')

    const assessmentSummary = formatAssessmentsForPrompt(assessments)

    const prompt = `أنت خبير متخصص في برامج الرياضة المعدلة وعلم النفس لأطفال ADHD وطيف التوحد. مهمتك إنشاء برنامج أسبوعي علمي ومخصص بناءً على ملف الطفل الكامل بما يشمل نتائج التقييمات الرسمية.

## ملف الطفل:
- الاسم: ${fullName}
- الفئة العمرية: ${AGE_AR[ageGroup] || ageGroup}
- التشخيص: ${DIAG_AR[diagnosis] || diagnosis}
- درجة الشدة: ${SEV_AR[severityLevel] || severityLevel}
- الحساسية البصرية: ${sensoryLabels.visual}
- الحساسية السمعية: ${sensoryLabels.audio}
- الحساسية اللمسية: ${sensoryLabels.touch}

## نتائج التقييمات السريرية:
${assessmentSummary}

## التمارين المتاحة:
${exList}

## تعليمات التوليد:
1. أنشئ جدولاً أسبوعياً من الاثنين إلى الجمعة (السبت والأحد راحة)
2. ضع 2-3 تمارين لكل يوم
3. الأولويات الأساسية:
   - ADHD: ابدأ بتمارين الطاقة والحركي، ثم التركيز والانتباه
   - التوحد: اهتم بالتمارين الحسية والاجتماعية والتوازن
   - شدة خفيفة: مستوى مبتدئ/متوسط | شدة متوسطة/شديدة: ابدأ بالمبتدئ
   - حساسية سمعية عالية: تجنب التمارين الصاخبة
   - حساسية لمسية عالية: تجنب التمارين ذات الملمس الكثيف
4. إذا وُجدت تقييمات سريرية فاستخدم نتائجها مباشرةً:
   - المجالات ذات الدرجات العالية تحتاج تمارين علاجية مستهدفة
   - التوصيات الواردة في التقييم يجب أن تنعكس في اختيار التمارين
5. نوّع التمارين على مدار الأسبوع، لا تكرر نفس التمرين كل يوم
6. اجعل الثلاثاء والخميس أخف قليلاً من باقي الأيام

## الرد المطلوب (JSON فقط، بدون أي نص إضافي):
{
  "title": "برنامج ${fullName.split(' ')[0]} التطوري",
  "rationale": "جملتان تشرحان المنطق العلمي للبرنامج مع ذكر نتائج التقييم إن وُجدت",
  "schedule": {
    "monday": ["id1", "id2", "id3"],
    "tuesday": ["id4", "id5"],
    "wednesday": ["id1", "id6"],
    "thursday": ["id2", "id4"],
    "friday": ["id3", "id7"],
    "saturday": [],
    "sunday": []
  }
}`

    // Rate limit: max 10 AI generations per hour, per dashboard account (cost control) —
    // keyed by actor so one busy staff member can't lock out everyone else.
    const actorId = await getDashboardActorId()
    const rateLimitKey = `ai_prog_limit:${actorId ?? 'unknown'}`
    const count = await redis.incr(rateLimitKey)
    if (count === 1) await redis.expire(rateLimitKey, 3600)
    if (count > 10) {
      return NextResponse.json({ error: 'تجاوزت الحد الأقصى (10 توليدات/ساعة) — انتظر قليلاً' }, { status: 429 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract outermost JSON object with balanced-brace scan (avoids greedy-regex over-extension)
    let depth = 0, jsonStart = -1, jsonEnd = -1
    for (let i = 0; i < rawText.length; i++) {
      if (rawText[i] === '{') { if (depth === 0) jsonStart = i; depth++ }
      else if (rawText[i] === '}') { depth--; if (depth === 0 && jsonStart !== -1) { jsonEnd = i; break } }
    }
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json({ error: 'لم يتمكن الذكاء الاصطناعي من توليد البرنامج — حاول مرة أخرى' }, { status: 500 })
    }

    let result: { title?: string; rationale?: string; schedule?: Record<string, string[]> }
    try {
      result = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1))
    } catch {
      return NextResponse.json({ error: 'البرنامج المولَّد تالف البنية — أعد المحاولة' }, { status: 500 })
    }

    if (!result.schedule || typeof result.schedule !== 'object') {
      return NextResponse.json({ error: 'لم يُنتج الذكاء الاصطناعي جدولاً أسبوعياً — أعد المحاولة' }, { status: 500 })
    }

    // Validate that returned exercise IDs exist; force weekends to empty
    const validIds = new Set(allExercises.map(e => e.id))
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for (const day of days) {
      if (day === 'saturday' || day === 'sunday') { result.schedule[day] = []; continue }
      if (!Array.isArray(result.schedule[day])) result.schedule[day] = []
      result.schedule[day] = result.schedule[day].filter((id: string) => validIds.has(id))
    }

    return NextResponse.json({
      title: result.title || `برنامج ${fullName.split(' ')[0]} التطوري`,
      rationale: result.rationale || '',
      schedule: result.schedule,
    })

  } catch (e) {
    console.error('[ai-generate-program]', e)
    // Surface the real cause when it's the Anthropic API itself (bad/expired key, out of
    // credit, rate-limited, overloaded) — these need a different fix than a code bug, and
    // the generic message was indistinguishable from one in the dashboard.
    if (e instanceof Anthropic.APIError) {
      if (e.status === 401 || e.status === 403) {
        return NextResponse.json({ error: 'مفتاح AI غير صالح أو منتهي الصلاحية — راجع ANTHROPIC_API_KEY' }, { status: 500 })
      }
      if (e.status === 429) {
        return NextResponse.json({ error: 'تجاوز حساب AI حدّه (rate limit) أو انتهى الرصيد — حاول بعد قليل' }, { status: 500 })
      }
      return NextResponse.json({ error: `خطأ من خدمة AI (${e.status ?? 'unknown'}) — حاول مرة أخرى` }, { status: 500 })
    }
    return NextResponse.json({ error: 'حدث خطأ في توليد البرنامج' }, { status: 500 })
  }
}
