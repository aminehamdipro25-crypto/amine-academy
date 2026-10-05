// Copying the work log's lessons into the owner's own Notion database.
//
// The database is the owner's, with the owner's column names — so nothing
// here assumes a name. The app reads the database's columns, guesses which
// one should receive what (guessNotionMap), and the owner confirms or changes
// that mapping in Settings. A field mapped to nothing is simply not written.
//
// This file is pure (no network, no Redis) so the mapping can be tested.

import { endTime, lessonChild, type WorkClient, type WorkLesson, type WorkSettings } from './worklog'

/** The lesson fields that can be written to Notion. */
export const NOTION_FIELDS = ['title', 'date', 'status', 'price', 'duration', 'family', 'child', 'note'] as const
export type NotionField = typeof NOTION_FIELDS[number]

/** Field → the name of the Notion column that receives it. */
export type NotionMap = Partial<Record<NotionField, string>>

export interface NotionConfig {
  databaseId: string
  map: NotionMap
}

/** A Notion column as the database reports it. */
export interface NotionProp {
  name: string
  type: string
  /** Option names, for select / status / multi_select columns. */
  options?: string[]
}

export const NOTION_FIELD_LABEL: Record<NotionField, string> = {
  title: 'عنوان الصف (الطفل — العائلة)',
  date: 'التاريخ والوقت',
  status: 'الحالة (مجدولة/تمّت/ملغاة)',
  price: 'السعر',
  duration: 'المدة',
  family: 'العائلة',
  child: 'الطفل',
  note: 'الملاحظة',
}

/** Which Notion column types can hold each field. */
export const NOTION_FIELD_TYPES: Record<NotionField, string[]> = {
  title: ['title'],
  date: ['date'],
  status: ['select', 'status', 'rich_text'],
  price: ['number', 'rich_text'],
  duration: ['number', 'rich_text'],
  family: ['select', 'rich_text', 'multi_select'],
  child: ['select', 'rich_text', 'multi_select'],
  note: ['rich_text'],
}

const NAME_HINTS: Partial<Record<NotionField, RegExp>> = {
  status: /حال|status|state|وضع/i,
  price: /سعر|مبلغ|أجر|ثمن|price|amount|cost|fee|rate/i,
  duration: /مدة|مدّة|ساع|دقي|duration|hours?|minutes?|time spent/i,
  family: /عائل|ولي|أسرة|family|parent|client|عميل/i,
  child: /طفل|تلميذ|طالب|ابن|child|student|kid|pupil/i,
  note: /ملاحظ|وصف|تفاصيل|note|comment|detail|description/i,
}

/** Accepts a database link or a bare id; returns the dashed UUID, or null. */
export function parseNotionDbId(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const v = input.trim()
  // In a link the database id is the 32-hex run in the path, before any "?v=" view id.
  const path = v.split('?')[0]
  const m = path.replace(/-/g, '').match(/([0-9a-f]{32})(?![0-9a-f])/i)
  if (!m) return null
  const h = m[1].toLowerCase()
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Reads the columns out of a GET /v1/databases/{id} response. */
export function parseNotionSchema(db: unknown): NotionProp[] {
  const props = (db as { properties?: Record<string, { type?: string; select?: { options?: { name: string }[] }; status?: { options?: { name: string }[] }; multi_select?: { options?: { name: string }[] } }> })?.properties
  if (!props || typeof props !== 'object') return []
  return Object.entries(props).map(([name, p]) => {
    const type = String(p?.type ?? '')
    const opts = (p as Record<string, { options?: { name: string }[] }>)[type]?.options
    return { name, type, ...(Array.isArray(opts) ? { options: opts.map(o => o.name) } : {}) }
  })
}

/**
 * A first guess at the mapping: the title column for the title, the first
 * date column for the date, and the rest by the column's name. Each column is
 * used once. The owner confirms it in Settings — a guess is never final.
 */
export function guessNotionMap(schema: NotionProp[]): NotionMap {
  const used = new Set<string>()
  const map: NotionMap = {}
  const take = (f: NotionField, p: NotionProp | undefined) => { if (p) { map[f] = p.name; used.add(p.name) } }
  const fits = (f: NotionField) => schema.filter(p => NOTION_FIELD_TYPES[f].includes(p.type) && !used.has(p.name))

  take('title', fits('title')[0])
  take('date', fits('date')[0])
  for (const f of ['status', 'price', 'duration', 'family', 'child', 'note'] as NotionField[]) {
    take(f, fits(f).find(p => NAME_HINTS[f]!.test(p.name)))
  }
  // An unnamed number column is most likely the price.
  if (!map.price) take('price', fits('price').find(p => p.type === 'number'))
  return map
}

/** Drops mappings to columns that no longer exist or have an incompatible type. */
export function validNotionMap(map: NotionMap, schema: NotionProp[]): NotionMap {
  const byName = new Map(schema.map(p => [p.name, p]))
  const out: NotionMap = {}
  for (const f of NOTION_FIELDS) {
    const name = map[f]
    const p = name ? byName.get(name) : undefined
    if (p && NOTION_FIELD_TYPES[f].includes(p.type)) out[f] = p.name
  }
  return out
}

const STATUS_WORD: Record<WorkLesson['status'], string> = { scheduled: 'مجدولة', done: 'تمّت', cancelled: 'ملغاة' }

const text = (s: string) => [{ type: 'text', text: { content: s.slice(0, 2000) } }]

/** One value written into one column, shaped for that column's type; null = cannot be written. */
function valueFor(p: NotionProp, value: string | number): Record<string, unknown> | null {
  switch (p.type) {
    case 'title': return { title: text(String(value)) }
    case 'rich_text': return { rich_text: text(String(value)) }
    case 'number': return typeof value === 'number' ? { number: value } : null
    case 'select': return { select: { name: String(value).replace(/,/g, ' ').slice(0, 100) } }
    case 'multi_select': return { multi_select: [{ name: String(value).replace(/,/g, ' ').slice(0, 100) }] }
    // A status column only accepts options that already exist in it.
    case 'status': return p.options?.includes(String(value)) ? { status: { name: String(value) } } : null
    default: return null
  }
}

/**
 * The Notion `properties` for one lesson. Dates carry the work log's time zone,
 * so «15:00» in the ledger is 15:00 in Notion whatever zone the phone is in.
 */
export function lessonNotionProperties(
  l: WorkLesson, c: Pick<WorkClient, 'name' | 'childName'> | undefined, cfg: NotionConfig, schema: NotionProp[],
  settings: Pick<WorkSettings, 'timezone' | 'currency'>,
): Record<string, unknown> {
  const byName = new Map(schema.map(p => [p.name, p]))
  const out: Record<string, unknown> = {}
  const put = (f: NotionField, value: string | number | undefined): boolean => {
    const p = cfg.map[f] ? byName.get(cfg.map[f]!) : undefined
    if (!p || value === undefined || value === '') return false
    const v = valueFor(p, value)
    if (v) out[p.name] = v
    return !!v
  }

  const child = lessonChild(l, c)
  const family = c?.name ?? ''
  put('title', [child, family].filter(Boolean).join(' — ') || 'حصة')

  const dateP = cfg.map.date ? byName.get(cfg.map.date) : undefined
  if (dateP?.type === 'date') {
    out[dateP.name] = { date: { start: `${l.date}T${l.start}:00`, end: `${l.date}T${endTime(l.start, l.durationMin)}:00`, time_zone: settings.timezone } }
  }

  // A status column with no «ملغاة (محتسبة)» option still gets «ملغاة».
  if (!(l.status === 'cancelled' && l.charged && put('status', 'ملغاة (محتسبة)'))) put('status', STATUS_WORD[l.status])
  const priceP = cfg.map.price ? byName.get(cfg.map.price) : undefined
  put('price', priceP?.type === 'number' ? l.price : `${l.price} ${settings.currency === 'TND' ? 'د.ت' : 'ر.ق'}`)
  const durP = cfg.map.duration ? byName.get(cfg.map.duration) : undefined
  if (durP?.type === 'number') {
    // A column named in minutes gets minutes; otherwise hours, as people log them.
    put('duration', /دقي|min/i.test(durP.name) ? l.durationMin : Math.round((l.durationMin / 60) * 100) / 100)
  } else {
    put('duration', `${l.durationMin} د`)
  }
  put('family', family)
  put('child', child)
  put('note', [l.status === 'cancelled' && l.cancelReason ? `سبب الإلغاء: ${l.cancelReason}` : '', l.note ?? ''].filter(Boolean).join(' · '))
  return out
}
