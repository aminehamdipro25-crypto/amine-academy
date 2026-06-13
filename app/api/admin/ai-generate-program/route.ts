import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getStudent, getAllExercises } from '@/lib/db'
import { redis } from '@/lib/redis'
import Anthropic from '@anthropic-ai/sdk'
import type { AssessmentResult } from '@/lib/types'

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
    lines.push(`\n### ${typeLabel} (${new Date(a.createdAt).toLocaleDateString('ar')})`)
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
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!await verifyAdminSession(token)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'مفتاح AI غير مُعدّ في المتغيرات البيئية' }, { status: 500 })
    }

    const { studentId } = await req.json().catch(() => ({}))
    if (!studentId) return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 })

    const [student, allExercises, assessments] = await Promise.all([
      getStudent(studentId),
      getAllExercises(),
      getStudentAssessments(studentId),
    ])

    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })

    // Filter exercises relevant to this student
    const relevant = allExercises.filter(ex =>
      ex.ageGroups.includes(student.ageGroup) &&
      (ex.diagnoses.includes(student.diagnosis) || ex.diagnoses.includes('OTHER') ||
       ex.diagnoses.length === 0)
    )

    const exList = relevant.map(ex =>
      `• ID: ${ex.id} | ${ex.titleAr || ex.title} | فئة: ${CAT_AR[ex.category] || ex.category} | مستوى: ${ex.difficulty} | مدة: ${ex.durationMinutes} دقيقة | نقاط: ${ex.points}`
    ).join('\n')

    const assessmentSummary = formatAssessmentsForPrompt(assessments)

    const prompt = `أنت خبير متخصص في برامج الرياضة المعدلة وعلم النفس لأطفال ADHD وطيف التوحد. مهمتك إنشاء برنامج أسبوعي علمي ومخصص بناءً على ملف الطفل الكامل بما يشمل نتائج التقييمات الرسمية.

## ملف الطفل:
- الاسم: ${student.firstName} ${student.lastName}
- الفئة العمرية: ${AGE_AR[student.ageGroup] || student.ageGroup}
- التشخيص: ${DIAG_AR[student.diagnosis] || student.diagnosis}
- درجة الشدة: ${SEV_AR[student.severityLevel] || student.severityLevel}
- الحساسية البصرية: ${SENS_AR[student.sensoryProfile.visualSensitivity]}
- الحساسية السمعية: ${SENS_AR[student.sensoryProfile.audioSensitivity]}
- الحساسية اللمسية: ${SENS_AR[student.sensoryProfile.touchSensitivity]}

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
  "title": "برنامج ${student.firstName} التطوري",
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

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1536,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'لم يتمكن الذكاء الاصطناعي من توليد البرنامج — حاول مرة أخرى' }, { status: 500 })
    }

    const result = JSON.parse(jsonMatch[0])

    // Validate that returned exercise IDs exist
    const validIds = new Set(allExercises.map(e => e.id))
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for (const day of days) {
      if (!Array.isArray(result.schedule[day])) result.schedule[day] = []
      result.schedule[day] = result.schedule[day].filter((id: string) => validIds.has(id))
    }

    return NextResponse.json({
      title: result.title || `برنامج ${student.firstName} التطوري`,
      rationale: result.rationale || '',
      schedule: result.schedule,
    })

  } catch (e) {
    console.error('[ai-generate-program]', e)
    return NextResponse.json({ error: 'حدث خطأ في توليد البرنامج' }, { status: 500 })
  }
}
