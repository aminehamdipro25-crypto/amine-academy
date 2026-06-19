import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import { getStudent } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

interface AbcEntry {
  antecedent: string
  behavior: string
  consequence: string
  intensity: 1 | 2 | 3
  ts: string
}

interface SessionResult {
  exerciseType: string
  score: number
  exerciseLabelAr: string
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
      abcLog = [],
      sessionResults = [],
      sessionCount = 0,
      diagnosis = 'ADHD',
      observations = '',
    } = body as {
      studentId: string
      abcLog: AbcEntry[]
      sessionResults: SessionResult[]
      sessionCount: number
      diagnosis: string
      observations?: string
    }

    const student = await getStudent(studentId)
    const studentName = student ? `${student.firstName} ${student.lastName}` : 'الطفل'

    // Build ABC log text
    let abcText = 'لا توجد سجلات ABC مسجلة.'
    if (abcLog.length > 0) {
      const INTENSITY_LABELS: Record<number, string> = { 1: 'خفيفة', 2: 'متوسطة', 3: 'شديدة' }
      abcText = abcLog
        .map((e, i) =>
          `${i + 1}. [${new Date(e.ts).toLocaleDateString('fr-FR')}] مثير: ${e.antecedent} | سلوك: ${e.behavior} (${INTENSITY_LABELS[e.intensity] ?? e.intensity}) | نتيجة: ${e.consequence}`
        )
        .join('\n')
    }

    // Build session results text
    let resultsText = 'لا توجد نتائج تمارين مسجلة.'
    if (sessionResults.length > 0) {
      resultsText = sessionResults
        .map(r => `- ${r.exerciseLabelAr} (${r.exerciseType}): ${r.score}٪`)
        .join('\n')
    }

    // Build observations text
    const observationsText = observations?.trim()
      ? `ملاحظات الأستاذ من الجلسات الأخيرة:\n${observations.trim()}`
      : 'لم تُقدَّم ملاحظات إضافية.'

    const prompt = `أنت أستاذ أمين حمدي، أخصائي تأهيل حركي وظيفي ومختص في النشاط البدني المعدل لأطفال ADHD والتوحد. بناءً على البيانات التالية، قدّم تحليلاً سريرياً دقيقاً وقابلاً للتنفيذ.

معلومات الطفل:
- الاسم: ${studentName}
- التشخيص: ${diagnosis}
- عدد الجلسات المسجلة: ${sessionCount}

سجلات ABC السلوكية:
${abcText}

نتائج التمارين:
${resultsText}

${observationsText}

المطلوب — اكتب تحليلاً سريرياً بالعربية يتضمن:
1. أبرز المثيرات (Antecedents) المتكررة التي تسبق السلوكيات الإشكالية
2. أنماط شدة السلوك وتوزيعها عبر الجلسات
3. التمارين التي ارتبطت بأعلى الأداء والتمارين التي ارتبطت بأدنى الأداء
4. توصيتان عمليتان محددتان للجلسات القادمة

القواعد:
- اكتب بالعربية الفصحى المبسطة
- الأسلوب: سريري ومهني وقابل للتطبيق
- الطول: 150-200 كلمة
- ابدأ مباشرة بالتحليل دون مقدمة
- إذا كانت البيانات شحيحة، اعتمد على الملاحظات المقدمة وقدّم توصيات عامة مبنية على أفضل الممارسات في تأهيل أطفال ${diagnosis}
`

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    })

    const analysis = message.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('[ai-analyze-patterns]', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'حدث خطأ أثناء تحليل الأنماط' }, { status: 500 })
  }
}
