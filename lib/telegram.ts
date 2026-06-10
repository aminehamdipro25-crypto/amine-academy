const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT   = process.env.TELEGRAM_CHAT_ID

// Escape user-supplied strings before embedding in HTML parse_mode messages
export function tgEsc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function tg(message: string): Promise<void> {
  if (!TOKEN || !CHAT) return
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text: message, parse_mode: 'HTML' }),
    })
    if (!res.ok) console.warn('[telegram] API error', res.status, await res.text())
  } catch (e) {
    console.warn('[telegram] send failed:', (e as Error).message)
  }
}
