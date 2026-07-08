import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser, getDashboardActorId } from '@/lib/auth'
import { getStudent } from '@/lib/db'
import { isRateLimited } from '@/lib/rateLimit'
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
  if (!(await isDashboardUser())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  // Each call costs real money against the Anthropic API — cap per-actor so
  // a compromised/left-open dashboard session can't run it unbounded.
  const actorId = (await getDashboardActorId()) ?? 'unknown'
  const rl = await isRateLimited(`ai_report:${actorId}`, 30, 3600)
  if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة جداً، حاول لاحقاً' }, { status: 429 })

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

    const prompt = `أنت الأستاذ أمين حمدي، أخصائي معتمد في التربية البدنية المعدّلة والتأهيل الحركي الوظيفي لأطفال ADHD وطيف التوحد. مهمتك كتابة الملخص الأكاديمي الذكي لتقرير ${REPORT_TYPE_AR[type] || type} في وثيقة رسمية تُسلَّم لأسرة الطفل.

═══ بيانات الجلسة / الفترة ═══
• الطفل: ${studentName}
• التشخيص: ${diagnosis}${ageGroup ? ` | الفئة العمرية: ${ageGroup}` : ''}
• الفترة: ${periodStart || '–'} إلى ${periodEnd || '–'}
• التمارين المكتملة: ${completedExercises} من ${totalExercises} (${completionPct}%)
• النقاط المكتسبة: ${pointsEarned} نقطة

═══ التقييم السلوكي المعياري ═══
${ratingsText || '• لم تُحدَّد تقييمات سلوكية لهذه الجلسة'}

═══ تعليمات الكتابة ═══
اكتب فقرة واحدة متماسكة من 4-5 جمل بالعربية الفصحى المبسطة تتضمن بالترتيب:
1. انطباع عام موضوعي عن مستوى الأداء في هذه الفترة مستنداً إلى الأرقام
2. أبرز نقطة قوة حقيقية مستخلصة من التقييم السلوكي
3. مجال واحد يستحق الاهتمام المتزايد في الجلسات القادمة
4. توصية عملية واحدة قابلة للتطبيق الأسبوع القادم في المنزل

قواعد الأسلوب:
• لغة مهنية دافئة — ليست بيروقراطية ولا عاطفية مبالغة
• إيجابي وواقعي في الوقت ذاته
• ابدأ مباشرة بالمحتوى (لا مقدمة من نوع "ملاحظات:" أو "بسم الله")
• لا تكرر اسم الطفل في البداية — سيظهر في عنوان التقرير
• الحد الأقصى: 130 كلمة
`

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 768,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = message.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    return NextResponse.json({ summary })
  } catch (err) {
    console.error('[ai-generate-report-summary]', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'حدث خطأ أثناء توليد الملخص' }, { status: 500 })
  }
}
