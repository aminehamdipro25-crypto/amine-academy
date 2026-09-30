import { redis } from '@/lib/redis'

// ── Amine Languages — interest leads (read/convert side) ─────────────────────
// Leads are written by app/api/languages/lead. Keys:
//   language_lead:<id>       → lead JSON
//   language_leads:index     → [id] (LPUSH newest-first)

export interface LanguageLead {
  id: string
  name: string
  email: string
  phone: string
  language: string
  level: string
  goal?: string
  note?: string
  source?: string
  status: 'new' | 'converted'
  createdAt: string
}

const KEY = (id: string) => `language_lead:${id}`

export async function getAllLanguageLeads(): Promise<LanguageLead[]> {
  const ids = await redis.lrange('language_leads:index', 0, -1)
  if (!ids.length) return []
  const rows = await redis.mget<LanguageLead>(ids.map(KEY))
  return (rows.filter(Boolean) as LanguageLead[])
}

export async function getLanguageLead(id: string): Promise<LanguageLead | null> {
  return redis.get<LanguageLead>(KEY(id))
}

export async function markLeadConverted(id: string): Promise<void> {
  const lead = await getLanguageLead(id)
  if (!lead) return
  await redis.set(KEY(id), { ...lead, status: 'converted' })
}
