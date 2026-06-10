const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT   = process.env.TELEGRAM_CHAT_ID

export async function tg(message: string): Promise<void> {
  if (!TOKEN || !CHAT) return
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text: message, parse_mode: 'HTML' }),
    })
  } catch (e) {
    console.warn('[telegram] send failed:', (e as Error).message)
  }
}
