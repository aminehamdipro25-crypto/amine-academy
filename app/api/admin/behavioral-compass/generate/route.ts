import { NextRequest, NextResponse } from 'next/server'
import { isDashboardUser, getDashboardActorId } from '@/lib/auth'
import { isRateLimited } from '@/lib/rateLimit'
import Anthropic from '@anthropic-ai/sdk'
import type { GeneratedTool } from '@/lib/behavioral-compass'

export const runtime = 'nodejs'
// Claude can take longer than the 10s Vercel default for a full tool.
export const maxDuration = 60

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

// برومبت التصميم (مقتبس من دليل الأخصائي) — يُنتج أداة فحص غير معياريّة أصليّة.
function buildPrompt(axis: string, ageGroup: string, duration: string, context: string): string {
  return `أنت مختصّ في القياس التربوي وتصميم أدوات الملاحظة السلوكيّة للأطفال، ولست مرخّصاً لتطبيق الاختبارات النفسيّة المقنّنة.

صمّم أداة فحص غير معياريّة لتخطيط التدخّل ومتابعة التقدّم فقط، حول المحور التالي:
• المحور: ${axis}
• الفئة العمريّة: ${ageGroup}
• مدّة التطبيق: ${duration}
• السياق: ${context}

قيود إلزاميّة:
- لا تنسخ بنود أيّ اختبار مقنّن محمي بحقوق نشر؛ كل البنود أصليّة من تأليفك.
- لا تضع عتبات تشخيصيّة ولا تُسمّ أيّ اضطراب.
- العبارات بلغة مناسبة للعمر، وبعضها سالب الصياغة يُحسب معكوساً (5 − الإجابة) على سلّم 1–4 (أبداً/أحياناً/غالباً/دائماً).
- استمارة التقرير الذاتي من 20 إلى 28 عبارة كلّها حول هذا المحور الواحد.
- اذكر صراحةً حدود الأداة ومتى تُحال الحالة إلى أخصائي نفسي.

أعِد **JSON فقط** (دون أيّ نصّ قبله أو بعده، ودون أسوار markdown) بهذا الشكل بالضبط:
{
  "title": "اسم مختصر للأداة",
  "concepts": [{"name":"مفهوم علميّ","explanation":"سطران يشرحان ما يقيسه"}],              // 3 أو 4
  "selfReport": {
    "instruction": "تعليمة قصيرة تُقرأ للطفل",
    "items": [{"text":"عبارة","reverse":true|false}]                                         // 20..28
  },
  "tasks": [{"level":1|2|3,"prompt":"مهمّة ملاحظة سلوكيّة متدرّجة الصعوبة","note":"ما يُلاحَظ"}], // عدّة مهام عبر 3 مستويات
  "recordingIndicators": ["مؤشّر قابل للعدّ (زمن/تكرار/عبارة)"],                                 // 6..10
  "parentInterview": ["سؤال لوليّ الأمر"],                                                     // 8..10
  "openQuestions": ["سؤال مفتوح يُطرح شفهيّاً"],                                                // 3
  "correctionNote": "شرح موجز لطريقة التصحيح (العبارات المعكوسة والمجموع والفئات الثلاث)",
  "resultsTable": [{"pattern":"نمط نتيجة","hypothesis":"فرضيّة تفسيريّة","priority":"أولويّة تدخّل"}], // 3..5
  "protocol": [{"title":"خطوة","detail":"تفصيل عملي"}],                                         // 5..7
  "remeasure": ["مؤشّر إعادة القياس بعد 8–12 أسبوعاً"],                                         // 2..4
  "limits": "فقرة عن حدود الأداة (غير معياريّة، ليست تشخيصاً)",
  "referral": "جملة واضحة عن متى تُحال الحالة"
}`
}

function coerceTool(raw: unknown, meta: { axis: string; ageGroup: string; duration: string; context: string }): GeneratedTool | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const arr = <T,>(v: unknown, map: (x: Record<string, unknown>) => T): T[] =>
    Array.isArray(v) ? v.filter(x => x && typeof x === 'object').map(x => map(x as Record<string, unknown>)) : []
  const strArr = (v: unknown): string[] => Array.isArray(v) ? v.map(x => str(x, 400)).filter(Boolean) : []

  const items = arr<{ id: string; text: string; reverse: boolean }>(o.selfReport && (o.selfReport as Record<string, unknown>).items, (x, ) => ({
    id: '', text: str(x.text, 300), reverse: x.reverse === true,
  })).filter(i => i.text).map((i, idx) => ({ ...i, id: `G${idx + 1}` }))

  if (items.length < 6) return null  // توليد فاشل

  return {
    title: str(o.title, 120) || `أداة ${meta.axis}`,
    axisLabel: meta.axis,
    ageGroup: meta.ageGroup,
    duration: meta.duration,
    context: meta.context,
    concepts: arr<{ name: string; explanation: string }>(o.concepts, x => ({ name: str(x.name, 120), explanation: str(x.explanation, 400) })).filter(c => c.name),
    selfReport: { instruction: str((o.selfReport as Record<string, unknown>)?.instruction, 300), items },
    tasks: arr<{ level: 1 | 2 | 3; prompt: string; note?: string }>(o.tasks, x => {
      const lv = Number(x.level); return { level: (lv === 2 ? 2 : lv === 3 ? 3 : 1), prompt: str(x.prompt, 400), note: str(x.note, 300) || undefined }
    }).filter(t => t.prompt),
    recordingIndicators: strArr(o.recordingIndicators),
    parentInterview: strArr(o.parentInterview),
    openQuestions: strArr(o.openQuestions),
    correctionNote: str(o.correctionNote, 800),
    resultsTable: arr<{ pattern: string; hypothesis: string; priority: string }>(o.resultsTable, x => ({ pattern: str(x.pattern, 300), hypothesis: str(x.hypothesis, 400), priority: str(x.priority, 300) })).filter(r => r.pattern),
    protocol: arr<{ title: string; detail: string }>(o.protocol, x => ({ title: str(x.title, 120), detail: str(x.detail, 500) })).filter(p => p.title),
    remeasure: strArr(o.remeasure),
    limits: str(o.limits, 800),
    referral: str(o.referral, 600),
  }
}

export async function POST(req: NextRequest) {
  if (!await isDashboardUser()) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const actorId = (await getDashboardActorId()) ?? 'unknown'
  const rl = await isRateLimited(`bcompass_gen:${actorId}`, 20, 3600)
  if (rl.limited) return NextResponse.json({ error: 'طلبات كثيرة جداً، حاول لاحقاً' }, { status: 429 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY غير مضبوط' }, { status: 503 })

  try {
    const body = await req.json().catch(() => ({}))
    const axis = str(body.axis, 80)
    const ageGroup = str(body.ageGroup, 40)
    const duration = str(body.duration, 40)
    const context = str(body.context, 60)
    if (!axis || !ageGroup) return NextResponse.json({ error: 'المحور والفئة العمريّة مطلوبان' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: buildPrompt(axis, ageGroup, duration || 'غير محدّدة', context || 'فردي في جلسة') }],
    })

    let text = message.content.filter((b): b is { type: 'text'; text: string } => b.type === 'text').map(b => b.text).join('').trim()
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const match = text.match(/\{[\s\S]*\}/)
    let parsed: unknown
    try { parsed = JSON.parse(match ? match[0] : text) } catch {
      return NextResponse.json({ error: 'تعذّر توليد الأداة — حاول مرّة أخرى' }, { status: 502 })
    }

    const tool = coerceTool(parsed, { axis, ageGroup, duration, context })
    if (!tool) return NextResponse.json({ error: 'الأداة المولّدة غير مكتملة — حاول مرّة أخرى' }, { status: 502 })

    return NextResponse.json({ tool })
  } catch (err) {
    console.error('[behavioral-compass generate]', (err as Error).message)
    return NextResponse.json({ error: 'حدث خطأ أثناء التوليد' }, { status: 500 })
  }
}
