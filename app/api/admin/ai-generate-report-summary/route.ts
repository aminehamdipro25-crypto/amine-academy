import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getStudent } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const METRIC_LABELS: Record<string, string> = {
  attention:            'الانتباه والتركيز',
  impulse_control:      'كبح الاندفاعية',
  social_interaction:   'التفاعل الاجتماعي',
  motor_coordination:   'التنسيق الحركي',
  emotional_regulation: 'تنظيم المشاعر',
}

const SCORE_LABELS: Record<number, string> = {
  1: 'ضعيف جداً',
  2: 'ضعيف',
  3: 'متوسط',
  4: 'جيد',
  5: 'ممتاز',
}

const REPORT_TYPE_AR: Record<string, string> = {
  session: 'جلسة',
  weekly:  'أسبوعي',
  monthly: 'شهري',
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!(await verifyAdminSession(token))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY غير مضبوط' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const {
      studentId,
      type = 'session',
      periodStart,
      periodEnd,
      completedExercises,
      totalExercises,
      pointsEarned,
      behaviorRatings = [],
    } = body as {
      studentId: string
      type: string
      periodStart: string
      periodEnd: string
      completedExercises: number
      totalExercises: number
      pointsEarned: number
      behaviorRatings: { metric: string; score: number }[]
    }

    const student = await getStudent(studentId)
    const studentName = student ? `${student.firstName} ${student.lastName}` : 'الطفل'
    const diagnosis = student?.diagnosis || 'ADHD'
    const ageGroup = student?.ageGroup || ''

    const ratingsText = behaviorRatings
      .map(r => `- ${METRIC_LABELS[r.metric] ?? r.metric}: ${SCORE_LABELS[r.score] ?? r.score}/5`)
      .join('\n')

    const completionPct = totalExercises > 0
      ? Math.round((completedExercises / totalExercises) * 100)
      : 0

    const prompt = `أنت أستاذ أمين حمدي، معالج نفسي وتربوي متخصص في ADHD والتوحد. اكتب ملاحظات تقرير تقدم مهنية وموجزة بالعربية لتقرير ${REPORT_TYPE_AR[type] || type}.

بيانات الجلسة:
- الطفل: ${studentName}
- التشخيص: ${diagnosis}${ageGroup ? ` | الفئة العمرية: ${ageGroup}` : ''}
- الفترة: ${periodStart || '–'} إلى ${periodEnd || '–'}
- التمارين المكتملة: ${completedExercises} من ${totalExercises} (${completionPct}%)
- النقاط المكتسبة: ${pointsEarned} نقطة

التقييم السلوكي:
${ratingsText || '- لم تحدد تقييمات بعد'}

اكتب ملاحظات الأستاذ بالعربية تتضمن:
1. ملاحظة عامة عن أداء الطفل في هذه الجلسة/الفترة
2. أبرز نقاط القوة التي لوحظت
3. المجالات التي تحتاج تطوير
4. توصية عملية واحدة للأسرة لهذا الأسبوع

القواعد:
- استخدم العربية الفصحى المبسطة
- الأسلوب: إيجابي ومحفز مع الواقعية
- الطول: 3-4 جمل فقط (لا أكثر من 120 كلمة)
- لا تذكر اسم الطفل مرة أخرى في البداية (سيظهر في العنوان)
- ابدأ مباشرة بالملاحظة دون مقدمة مثل "ملاحظات:"
`

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    return NextResponse.json({ summary })
  } catch (err) {
    console.error('[ai-generate-report-summary]', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء توليد الملخص' }, { status: 500 })
  }
}
