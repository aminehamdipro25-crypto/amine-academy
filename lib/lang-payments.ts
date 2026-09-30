import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis'

// ── Amine Languages — packages + payment requests ────────────────────────────
// Payment itself is manual (Fawran / bank / WhatsApp), like the rest of the
// platform: the learner picks a package, a request is recorded and the owner
// confirms it — then prepaid lesson credits are granted.

export { LANGUAGE_PACKAGES, getPackage } from '@/lib/language-packages-data'
export type { LangPackage } from '@/lib/language-packages-data'

export type PayMethod = 'fawran' | 'bank' | 'whatsapp'
export interface LangPayment {
  id: string
  learnerId: string
  learnerName: string
  packageId: string
  packageName: string
  sessions: number
  amount: number
  currency: 'QAR' | 'TND'
  method: PayMethod
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt: string
}

const KEY = (id: string) => `lang_payment:${id}`
const INDEX = 'lang_payments:index'

export async function createLangPayment(data: Omit<LangPayment, 'id' | 'createdAt' | 'status'>): Promise<LangPayment> {
  const pay: LangPayment = { ...data, id: `lp_${randomUUID()}`, status: 'pending', createdAt: new Date().toISOString() }
  await redis.set(KEY(pay.id), pay)
  await redis.lpush(INDEX, pay.id)
  return pay
}
export async function getLangPayment(id: string): Promise<LangPayment | null> { return redis.get<LangPayment>(KEY(id)) }
export async function getAllLangPayments(): Promise<LangPayment[]> {
  const ids = await redis.lrange(INDEX, 0, -1)
  if (!ids.length) return []
  const rows = await redis.mget<LangPayment>(ids.map(KEY))
  return (rows.filter(Boolean) as LangPayment[]).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}
export async function updateLangPayment(id: string, updates: Partial<LangPayment>): Promise<void> {
  const cur = await getLangPayment(id); if (!cur) return
  await redis.set(KEY(id), { ...cur, ...updates })
}
