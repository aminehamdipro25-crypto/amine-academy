import { NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

const SYSTEM = `أنت مساعد ذكي لأكاديمية أمين الدولية للرياضة المعدلة وعلم النفس.

قواعد الرد الإلزامية:
- الرد بالعربية دائماً
- لا تستخدم نجوم أو markdown — نص عادي فقط
- رد في 2-3 جمل قصيرة كحد أقصى
- لا تذكر الذكاء الاصطناعي أبداً
- تخصص الأكاديمية: برامج للأطفال والشباب من 5-22 سنة المصابين بـ ADHD وطيف التوحد
- إذا لم تعرف الإجابة، قل "للاستفسار التخصصي تواصل مع الأستاذ أمين مباشرة عبر واتساب"`

interface Message { role: 'user' | 'assistant'; content: string }

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)

  if (await isRateLimited(`chat:${ip}`, 20, 3600)) {
    return NextResponse.json({ reply: 'حاول مجدداً بعد قليل.' })
  }

  const { messages }: { messages: Message[] } = await req.json()

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 10) {
    return NextResponse.json({ reply: 'حدث خطأ، حاول مجدداً.' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: 'للتواصل الفوري، راسلنا على واتساب.' })
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system:     SYSTEM,
      messages:   messages.slice(-6),
    })

    const block = response.content[0]
    if (!block || block.type !== 'text') {
      return NextResponse.json({ reply: 'للتواصل الفوري، راسلنا على واتساب.' })
    }
    return NextResponse.json({ reply: block.text.trim() })
  } catch {
    return NextResponse.json({ reply: 'للتواصل الفوري، راسلنا على واتساب.' })
  }
}
