import { redis } from '@/lib/redis'

export interface SiteSettings {
  prices: {
    basic:    { QAR: number; TND: number }
    standard: { QAR: number; TND: number }
    premium:  { QAR: number; TND: number }
  }
  discountPct: number
  discountLabel: string
  offerDurationDays: number
  whatsappNumber: string
  // Landing page stats (editable by admin — put YOUR real numbers)
  stats: {
    childrenCount: string    // e.g. "+12" or "12"
    satisfactionPct: string  // e.g. "97%"
    protocolsCount: string   // e.g. "+25"
    sessionMinutes: string   // e.g. "45"
    yearsExperience: string  // e.g. "+5"
  }
}

const SETTINGS_KEY = 'site:settings'

const DEFAULT_SETTINGS: SiteSettings = {
  prices: {
    basic:    { QAR: 179, TND: 49 },
    standard: { QAR: 369, TND: 99 },
    premium:  { QAR: 659, TND: 179 },
  },
  discountPct: 0,
  discountLabel: 'عرض التسجيل المبكر',
  offerDurationDays: 5,
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
  stats: {
    childrenCount:    '12',
    satisfactionPct:  '97%',
    protocolsCount:   '+25',
    sessionMinutes:   '45',
    yearsExperience:  '+5',
  },
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const stored = await redis.get<SiteSettings>(SETTINGS_KEY)
    if (stored && typeof stored === 'object') {
      // Deep-merge stored over defaults to handle any new keys added later
      return {
        ...DEFAULT_SETTINGS,
        ...stored,
        prices: {
          basic:    { ...DEFAULT_SETTINGS.prices.basic,    ...(stored.prices?.basic    ?? {}) },
          standard: { ...DEFAULT_SETTINGS.prices.standard, ...(stored.prices?.standard ?? {}) },
          premium:  { ...DEFAULT_SETTINGS.prices.premium,  ...(stored.prices?.premium  ?? {}) },
        },
        stats: { ...DEFAULT_SETTINGS.stats, ...(stored.stats ?? {}) },
      }
    }
  } catch (e) {
    console.error('[getSiteSettings]', (e as Error).message)
  }
  return { ...DEFAULT_SETTINGS }
}

export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSiteSettings()
  const next: SiteSettings = {
    ...current,
    ...updates,
    prices: updates.prices
      ? {
          basic:    { ...current.prices.basic,    ...(updates.prices.basic    ?? {}) },
          standard: { ...current.prices.standard, ...(updates.prices.standard ?? {}) },
          premium:  { ...current.prices.premium,  ...(updates.prices.premium  ?? {}) },
        }
      : current.prices,
  }
  await redis.set(SETTINGS_KEY, next)
  return next
}
