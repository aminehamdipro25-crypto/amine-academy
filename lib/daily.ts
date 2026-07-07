const DAILY_API = 'https://api.daily.co/v1/rooms'
const DAILY_TOKEN_API = 'https://api.daily.co/v1/meeting-tokens'

// How far in the future a freshly-ensured room should stay valid.
const ROOM_TTL_SEC = 12 * 3600
// If an existing room expires within this window, extend it.
const REFRESH_THRESHOLD_SEC = 60 * 60

interface DailyRoom { url: string; config?: { exp?: number } }

function roomProps(): Record<string, unknown> {
  return {
    enable_prejoin_ui: false,
    enable_knocking: false,
    start_video_off: false,
    start_audio_off: false,
    exp: Math.floor(Date.now() / 1000) + ROOM_TTL_SEC,
  }
}

export async function createDailyRoom(name: string): Promise<string> {
  const key = process.env.DAILY_API_KEY
  if (!key) throw new Error('DAILY_API_KEY not configured')

  const res = await fetch(DAILY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ name, properties: roomProps() }),
  })

  if (!res.ok) {
    // 409 = room already exists — reuse it (and make sure it's not expired)
    if (res.status === 409) {
      const existing = await ensureDailyRoom(name)
      if (existing) return existing
    }
    const err = await res.text()
    throw new Error(`Daily.co: ${res.status} ${err}`)
  }

  const data = await res.json() as DailyRoom
  return data.url
}

// Make sure the room exists AND is valid for the next hour. If it's expired
// or about to expire, push its `exp` forward so joins keep working across
// long sessions and re-openings. Called when a session/kid page loads.
export async function ensureDailyRoom(name: string): Promise<string | null> {
  const key = process.env.DAILY_API_KEY
  if (!key) return null

  try {
    const get = await fetch(`${DAILY_API}/${name}`, {
      headers: { Authorization: `Bearer ${key}` },
    })

    // Room doesn't exist yet → create it fresh
    if (get.status === 404) {
      return await createDailyRoom(name)
    }
    if (!get.ok) return null

    const room = await get.json() as DailyRoom
    const exp = room.config?.exp ?? 0
    const now = Math.floor(Date.now() / 1000)

    // Expired or expiring soon → extend the room's lifetime
    if (exp - now < REFRESH_THRESHOLD_SEC) {
      const upd = await fetch(`${DAILY_API}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ properties: { exp: now + ROOM_TTL_SEC } }),
      })
      if (upd.ok) {
        const updated = await upd.json() as DailyRoom
        return updated.url
      }
      // Refresh failed AND the room is already expired → don't hand back a
      // dead URL (would fail to join with no recovery). Signal failure instead.
      if (exp <= now) return null
    }
    return room.url
  } catch {
    return null
  }
}

// Mint a short-lived Daily meeting token scoped to one room. `isOwner` grants
// the specialist owner privileges (needed for server-side moderation). Returns
// null on any failure so the caller can fall back to a plain (untokened) join.
export async function createMeetingToken(roomName: string, isOwner: boolean): Promise<string | null> {
  const key = process.env.DAILY_API_KEY
  if (!key) return null
  try {
    const res = await fetch(DAILY_TOKEN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: isOwner,
          exp: Math.floor(Date.now() / 1000) + 4 * 3600,
        },
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { token?: string }
    return data.token ?? null
  } catch {
    return null
  }
}
