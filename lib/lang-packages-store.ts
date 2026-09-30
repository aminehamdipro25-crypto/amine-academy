import { redis } from '@/lib/redis'
import { LANGUAGE_PACKAGES as DEFAULTS, type LangPackage } from '@/lib/language-packages-data'

// Owner-editable package prices. Defaults live in language-packages-data.ts;
// an override map { id: { qar, tnd, sessions } } in Redis lets the owner change
// prices from the dashboard without a deploy. Reads merge the override onto
// the defaults so labels are always preserved.

const KEY = 'lang_packages_config'
type Override = Record<string, { qar?: number; tnd?: number; sessions?: number }>

export async function getLangPackages(): Promise<LangPackage[]> {
  const ov = (await redis.get<Override>(KEY)) || {}
  return DEFAULTS.map(p => {
    const o = ov[p.id] || {}
    return {
      ...p,
      qar: Number.isFinite(o.qar) ? Number(o.qar) : p.qar,
      tnd: Number.isFinite(o.tnd) ? Number(o.tnd) : p.tnd,
      sessions: Number.isFinite(o.sessions) && Number(o.sessions) > 0 ? Number(o.sessions) : p.sessions,
    }
  })
}

export async function getLangPackage(id: string): Promise<LangPackage | undefined> {
  return (await getLangPackages()).find(p => p.id === id)
}

export async function setLangPackages(overrides: Override): Promise<void> {
  // Keep only known ids and sane numbers.
  const clean: Override = {}
  for (const p of DEFAULTS) {
    const o = overrides[p.id]
    if (!o) continue
    clean[p.id] = {
      qar: Math.max(0, Math.round(Number(o.qar) || p.qar)),
      tnd: Math.max(0, Math.round(Number(o.tnd) || p.tnd)),
      sessions: Math.max(1, Math.round(Number(o.sessions) || p.sessions)),
    }
  }
  await redis.set(KEY, clean)
}
