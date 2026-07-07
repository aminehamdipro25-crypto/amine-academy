export async function createDailyRoom(name: string): Promise<string> {
  const key = process.env.DAILY_API_KEY
  if (!key) throw new Error('DAILY_API_KEY not configured')

  const res = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      name,
      properties: {
        enable_prejoin_ui: false,
        enable_knocking: false,
        start_video_off: false,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 4 * 3600,
      },
    }),
  })

  if (!res.ok) {
    // 409 = room already exists — fetch the existing one
    if (res.status === 409) {
      const get = await fetch(`https://api.daily.co/v1/rooms/${name}`, {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (get.ok) {
        const data = await get.json() as { url: string }
        return data.url
      }
    }
    const err = await res.text()
    throw new Error(`Daily.co: ${res.status} ${err}`)
  }

  const data = await res.json() as { url: string }
  return data.url
}
