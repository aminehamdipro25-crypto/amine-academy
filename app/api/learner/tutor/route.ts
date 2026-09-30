import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyLearnerToken, LEARNER_COOKIE } from '@/lib/learner-auth'
import { getLearner } from '@/lib/language-learners'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Msg { role: 'user' | 'assistant'; content: string }

function systemFor(level: string) {
  const lv = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level) ? level : 'A1'
  return `Tu es un partenaire de conversation en français, chaleureux et encourageant, pour un apprenant de niveau ${lv} (CECRL).
- Parle PRINCIPALEMENT en français, adapté au niveau ${lv} (phrases courtes et simples pour A1/A2 ; plus riches pour B1+).
- Garde tes réponses BRÈVES (1 à 3 phrases).
- Si l'apprenant fait une erreur importante, corrige-la gentiment en une ligne (ex. « Petite correction : on dit … »), sans le décourager.
- Termine TOUJOURS par une question simple pour continuer la conversation.
- Reste positif et patient. N'utilise jamais de contenu inapproprié.`
}
const fallback = 'Désolé, le partenaire de conversation est momentanément indisponible. Réessaie dans un instant !'

export async function POST(req: NextRequest) {
  const store = await cookies()
  const payload = await verifyLearnerToken(store.get(LEARNER_COOKIE)?.value)
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const rl = await isRateLimited(`lang_tutor:${getClientIp(req)}`, 60, 3600)
  if (rl.limited) return NextResponse.json({ reply: 'Tu as beaucoup pratiqué ! Reviens dans un moment. 🙂' }, { status: 200 })

  const learner = await getLearner(payload.id)
  const level = learner?.level || 'A1'

  const body = await req.json().catch(() => ({}))
  const raw = Array.isArray(body.messages) ? body.messages : []
  const messages: Msg[] = raw
    .filter((m: unknown): m is Msg => !!m && typeof (m as Msg).content === 'string' && ((m as Msg).role === 'user' || (m as Msg).role === 'assistant'))
    .map((m: Msg) => ({ role: m.role, content: m.content.slice(0, 800) }))
    .slice(-10)
  if (!messages.length) return NextResponse.json({ error: 'رسالة فارغة' }, { status: 400 })

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ reply: fallback })
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemFor(level),
      messages,
    })
    const block = response.content[0]
    if (!block || block.type !== 'text') return NextResponse.json({ reply: fallback })
    return NextResponse.json({ reply: block.text.trim() })
  } catch {
    return NextResponse.json({ reply: fallback })
  }
}
