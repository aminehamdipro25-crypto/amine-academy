// Pure package catalog — no server imports, so it is safe to use in client
// components (the public landing) as well as server code.
export interface LangPackage { id: string; sessions: number; ar: string; en: string; fr: string; qar: number; tnd: number; popular?: boolean }

export const LANGUAGE_PACKAGES: LangPackage[] = [
  { id: 'single', sessions: 1, ar: 'حصّة مفردة', en: 'Single lesson', fr: 'Cours unique', qar: 80, tnd: 40 },
  { id: 'pack4', sessions: 4, ar: 'باقة 4 حصص', en: '4-lesson pack', fr: 'Pack de 4 cours', qar: 280, tnd: 140, popular: true },
  { id: 'pack8', sessions: 8, ar: 'باقة 8 حصص (شهريّة)', en: '8-lesson pack (monthly)', fr: 'Pack de 8 cours (mensuel)', qar: 520, tnd: 260 },
]
export const getPackage = (id: string) => LANGUAGE_PACKAGES.find(p => p.id === id)
