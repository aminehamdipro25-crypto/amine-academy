import { redis } from '@/lib/redis'

export interface SiteSettings {
  prices: {
    session:  { QAR: number; TND: number }
    weekly:   { QAR: number; TND: number }
    monthly:  { QAR: number; TND: number }
  }
  discountPct: number
  discountLabel: string
  offerDurationDays: number
  whatsappNumber: string
  sessionsPerWeek: number
  sessionsPerMonth: number
  stats: {
    childrenCount:   string
    satisfactionPct: string
    protocolsCount:  string
    sessionMinutes:  string
    yearsExperience: string
  }
}

const SETTINGS_KEY = 'site:settings'

const DEFAULT_SETTINGS: SiteSettings = {
  prices: {
    session: { QAR: 49,  TND: 15  },
    weekly:  { QAR: 169, TND: 49  },
    monthly: { QAR: 549, TND: 149 },
  },
  discountPct: 0,
  discountLabel: 'عرض التسجيل المبكر',
  offerDurationDays: 5,
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
  sessionsPerWeek: 4,
  sessionsPerMonth: 16,
  stats: {
    childrenCount:   '12',
    satisfactionPct: '97%',
    protocolsCount:  '+25',
    sessionMinutes:  '45',
    yearsExperience: '+5',
  },
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stored = await redis.get<any>(SETTINGS_KEY)
    if (stored && typeof stored === 'object') {
      // Migrate old basic/standard/premium keys if they exist
      const storedPrices = stored.prices ?? {}
      const migratedPrices = storedPrices.session
        ? storedPrices
        : {
            session: storedPrices.basic    ?? DEFAULT_SETTINGS.prices.session,
            weekly:  storedPrices.standard ?? DEFAULT_SETTINGS.prices.weekly,
            monthly: storedPrices.premium  ?? DEFAULT_SETTINGS.prices.monthly,
          }

      return {
        ...DEFAULT_SETTINGS,
        ...stored,
        prices: {
          session: { ...DEFAULT_SETTINGS.prices.session, ...(migratedPrices.session ?? {}) },
          weekly:  { ...DEFAULT_SETTINGS.prices.weekly,  ...(migratedPrices.weekly  ?? {}) },
          monthly: { ...DEFAULT_SETTINGS.prices.monthly, ...(migratedPrices.monthly ?? {}) },
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
          session: { ...current.prices.session, ...(updates.prices.session ?? {}) },
          weekly:  { ...current.prices.weekly,  ...(updates.prices.weekly  ?? {}) },
          monthly: { ...current.prices.monthly, ...(updates.prices.monthly ?? {}) },
        }
      : current.prices,
  }
  await redis.set(SETTINGS_KEY, next)
  return next
}
