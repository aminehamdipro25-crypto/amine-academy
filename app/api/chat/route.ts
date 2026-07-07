import { NextResponse } from 'next/server'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

const SYSTEM_AR = `أنت مساعد ذكي لأكاديمية أمين الدولية للرياضة المعدلة وعلم النفس.

قواعد الرد الإلزامية:
- الرد بالعربية دائماً
- لا تستخدم نجوم أو markdown — نص عادي فقط
- رد في 2-3 جمل قصيرة كحد أقصى
- لا تذكر الذكاء الاصطناعي أبداً
- تخصص الأكاديمية: برامج للأطفال والشباب من 5-22 سنة المصابين بـ ADHD وطيف التوحد
- إذا لم تعرف الإجابة، قل "للاستفسار التخصصي تواصل مع الأستاذ أمين مباشرة عبر واتساب"`

const SYSTEM_EN = `You are a helpful assistant for Amine Academy — an international center for adapted physical activity and child psychology.

Mandatory rules:
- Always reply in English
- No markdown or asterisks — plain text only
- Keep answers to 2-3 short sentences maximum
- Never mention artificial intelligence
- Academy speciality: programs for children and youth aged 5-22 with ADHD and autism spectrum
- If you don't know the answer, say "For specialist advice, contact Prof. Amine directly on WhatsApp"`

const SYSTEM_FR = `Vous êtes un assistant intelligent pour l'Académie Amine — centre international d'activité physique adaptée et de psychologie de l'enfant.

Règles obligatoires :
- Répondre toujours en français
- Pas de markdown ni d'astérisques — texte brut uniquement
- Réponses de 2-3 phrases courtes maximum
- Ne jamais mentionner l'intelligence artificielle
- Spécialité de l'académie : programmes pour enfants et jeunes de 5-22 ans avec TDAH et autisme
- Si vous ne connaissez pas la réponse, dites "Pour un avis spécialisé, contactez Prof. Amine directement sur WhatsApp"`

function getSystem(lang?: string) {
  if (lang === 'en') return SYSTEM_EN
  if (lang === 'fr') return SYSTEM_FR
  return SYSTEM_AR
}

function fallback(lang?: string) {
  if (lang === 'en') return 'For immediate help, message us on WhatsApp.'
  if (lang === 'fr') return 'Pour une aide immédiate, écrivez-nous sur WhatsApp.'
  return 'للتواصل الفوري، راسلنا على واتساب.'
}

interface Message { role: 'user' | 'assistant'; content: string }

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)

  const rl = await isRateLimited(`chat:${ip}`, 20, 3600)
  if (rl.limited) {
    return NextResponse.json({
      reply: rl.unavailable
        ? 'الخدمة غير متوفرة مؤقتًا، يرجى المحاولة بعد قليل أو التواصل معنا على واتساب.'
        : 'حاول مجدداً بعد قليل.',
    })
  }

  let messages: Message[] = []
  let lang: string | undefined
  try {
    const body = await req.json()
    messages = Array.isArray(body?.messages) ? body.messages : []
    lang = typeof body?.lang === 'string' ? body.lang : undefined
  } catch {
    return NextResponse.json({ reply: 'حدث خطأ، حاول مجدداً.' })
  }

  if (messages.length === 0 || messages.length > 10) {
    return NextResponse.json({ reply: 'حدث خطأ، حاول مجدداً.' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: fallback(lang) })
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system:     getSystem(lang),
      messages:   messages.slice(-6),
    })

    const block = response.content[0]
    if (!block || block.type !== 'text') {
      return NextResponse.json({ reply: fallback(lang) })
    }
    return NextResponse.json({ reply: block.text.trim() })
  } catch {
    return NextResponse.json({ reply: fallback(lang) })
  }
}
