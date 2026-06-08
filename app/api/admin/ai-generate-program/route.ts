import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getStudent, getAllExercises } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!await verifyAdminSession(token)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY غير مضبوط في البيئة' }, { status: 503 })
  }

  try {
    const { studentId } = await req.json()
    if (!studentId) {
      return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 })
    }

    const [student, allExercises] = await Promise.all([
      getStudent(studentId),
      getAllExercises(),
    ])

    if (!student) {
      return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
    }

    const suitable = allExercises.filter(ex =>
      ex.ageGroups.includes(student.ageGroup) &&
      (ex.diagnoses.includes(student.diagnosis) || ex.diagnoses.includes('OTHER'))
    )

    if (suitable.length < 3) {
      return NextResponse.json({ error: 'لا توجد تمارين كافية لهذا الطالب. أحمّل مكتبة التمارين أولاً.' }, { status: 422 })
    }

    const exerciseList = suitable
      .map(ex => `${ex.id}|${ex.titleAr}|${ex.category}|${ex.difficulty}|${ex.durationMinutes}دقيقة`)
      .join('\n')

    const severityLabel = student.severityLevel === 1 ? 'خفيف' : student.severityLevel === 2 ? 'متوسط' : 'شديد'

    const prompt = `أنت الأستاذ أمين، متخصص في الرياضة المعدلة وعلم النفس لـ ADHD والتوحد. أنشئ جدولاً أسبوعياً متوازناً لهذا الطفل.

معلومات الطفل:
- الاسم: ${student.firstName}
- التشخيص: ${student.diagnosis}
- الفئة العمرية: ${student.ageGroup} سنة
- شدة الحالة: ${severityLabel} (${student.severityLevel}/3)

التمارين المتاحة (الصيغة: ID|الاسم|الفئة|الصعوبة|المدة):
${exerciseList}

المطلوب: أنشئ جدولاً أسبوعياً متوازناً يراعي:
- 2-4 تمارين يومياً (الإرهاق يضر)
- تنويع الفئات (تركيز، حركي، حسي، اجتماعي) عبر أيام الأسبوع
- الاثنين والثلاثاء: تمارين سهلة/بداية
- الأربعاء والخميس: تمارين أكثر تحدياً
- الجمعة: تمرين ممتع/خفيف
- السبت والأحد: تمرين واحد فقط أو لا شيء (راحة)
- شدة الحالة ${severityLabel}: ${student.severityLevel === 3 ? 'اختر التمارين الأكثر بساطة وقصر مدة' : student.severityLevel === 2 ? 'توازن بين السهل والمتوسط' : 'يمكن اختيار تمارين متوسطة إلى متقدمة'}

أرجع JSON فقط (بدون أي نص آخر) بهذا الشكل الدقيق:
{"monday":["ID1","ID2"],"tuesday":["ID3"],"wednesday":["ID4","ID5"],"thursday":["ID6"],"friday":["ID7"],"saturday":["ID8"],"sunday":[]}`

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'فشل في استخراج الجدول من الذكاء الاصطناعي' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string[]>

    // Validate: keep only IDs that actually exist in our filtered exercises
    const validIds = new Set(suitable.map(ex => ex.id))
    const schedule: Record<string, string[]> = {}
    for (const day of DAYS) {
      schedule[day] = (parsed[day] ?? []).filter(id => validIds.has(id))
    }

    const totalExercises = Object.values(schedule).flat().length

    return NextResponse.json({
      ok: true,
      schedule,
      studentName: student.firstName,
      totalExercises,
      suitableCount: suitable.length,
    })
  } catch (err) {
    console.error('[ai-generate-program]', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء التوليد الذكي' }, { status: 500 })
  }
}
