import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis'

// ── Amine Languages — packages + payment requests ────────────────────────────
// Payment itself is manual (Fawran / bank / WhatsApp), like the rest of the
// platform: the learner picks a package, a request is recorded and the owner
// confirms it — then prepaid lesson credits are granted.

export interface LangPackage { id: string; sessions: number; ar: string; en: string; fr: string; qar: number; tnd: number }

export const LANGUAGE_PACKAGES: LangPackage[] = [
  { id: 'single', sessions: 1, ar: 'حصّة مفردة', en: 'Single lesson', fr: 'Cours unique', qar: 80, tnd: 40 },
  { id: 'pack4', sessions: 4, ar: 'باقة 4 حصص', en: '4-lesson pack', fr: 'Pack de 4 cours', qar: 280, tnd: 140 },
  { id: 'pack8', sessions: 8, ar: 'باقة 8 حصص (شهريّة)', en: '8-lesson pack (monthly)', fr: 'Pack de 8 cours (mensuel)', qar: 520, tnd: 260 },
]
export const getPackage = (id: string) => LANGUAGE_PACKAGES.find(p => p.id === id)

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
