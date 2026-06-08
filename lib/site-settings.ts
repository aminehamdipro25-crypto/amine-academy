import { redis } from '@/lib/redis'

export interface SiteSettings {
  // Prices in QAR and TND
  prices: {
    basic:    { QAR: number; TND: number }
    standard: { QAR: number; TND: number }
    premium:  { QAR: number; TND: number }
  }
  // Discount
  discountPct: number   // 0 = no discount, 20 = 20% off
  discountLabel: string // e.g. "عرض التسجيل المبكر"
  // Countdown offer duration in days
  offerDurationDays: number
  // Contact
  whatsappNumber: string
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
