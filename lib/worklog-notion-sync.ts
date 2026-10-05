// Network side of the Notion copy: talks to api.notion.com with the owner's
// integration token (NOTION_TOKEN, server only) and remembers which Notion
// page holds which lesson.
//
// The work log stays the source of truth. A Notion failure never fails a
// lesson save: it is recorded (NOTION_LAST_KEY) and shown in Settings, and
// «مزامنة كل الحصص» repairs whatever was missed.

import { redis } from './redis'
import { getWork, getWorkSettings, listWork } from './worklog-store'
import { lessonNotionProperties, parseNotionSchema, validNotionMap, type NotionConfig, type NotionProp } from './worklog-notion'
import type { WorkClient, WorkLesson, WorkSettings } from './worklog'

const API = 'https://api.notion.com/v1'
const VERSION = '2022-06-28'
/** lesson id → Notion page id. No expiry: losing it would duplicate rows in Notion. */
const pageKey = (lessonId: string) => `worklog:notion:page:${lessonId}`
export const NOTION_LAST_KEY = 'worklog:notion:last'
/** Index of the lessons that have a Notion row — so the links are in the backup. */
export const NOTION_PAGES_INDEX = 'worklog:notion:pages'

export interface NotionLast { at: string; ok: boolean; error?: string; lessonId?: string }

export function notionTokenConfigured(): boolean {
  return !!process.env.NOTION_TOKEN
}

export class NotionError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

async function notion<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.NOTION_TOKEN
  if (!token) throw new NotionError('NOTION_TOKEN غير مضبوط في Vercel', 503)
  let res: Response
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': VERSION, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      cache: 'no-store',
    })
  } catch {
    throw new NotionError('تعذّر الوصول إلى نوشن — أعد المحاولة بعد قليل', 503)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; code?: string }
    // Notion's own reason, in the words the owner will see in Settings.
    const why = res.status === 404 || body.code === 'object_not_found'
      ? 'لم يُعثر على قاعدة البيانات — هل شاركتها مع التكامل (Connections ← اسم التكامل)؟'
      : res.status === 401 ? 'رمز نوشن مرفوض — تحقّق من NOTION_TOKEN'
        : res.status === 429 ? 'نوشن طلب التمهّل (حدّ الطلبات) — أعد المحاولة بعد قليل'
          : body.message ?? `خطأ من نوشن (${res.status})`
    throw new NotionError(why, res.status)
  }
  return res.json() as Promise<T>
}

export async function fetchNotionSchema(databaseId: string): Promise<{ title: string; props: NotionProp[] }> {
  const db = await notion<{ title?: { plain_text?: string }[] }>(`/databases/${databaseId}`)
  return { title: (db.title ?? []).map(t => t.plain_text ?? '').join('') || 'بلا عنوان', props: parseNotionSchema(db) }
}

function configOf(settings: WorkSettings): NotionConfig | null {
  return settings.notion?.databaseId ? { databaseId: settings.notion.databaseId, map: settings.notion.map ?? {} } : null
}

async function record(last: NotionLast) {
  try { await redis.set(NOTION_LAST_KEY, last) } catch { /* the status line is best-effort */ }
}

async function upsertOne(
  l: WorkLesson, c: WorkClient | undefined, cfg: NotionConfig, props: NotionProp[], settings: WorkSettings,
): Promise<void> {
  const map = validNotionMap(cfg.map, props)
  const properties = lessonNotionProperties(l, c, { ...cfg, map }, props, settings)
  const existing = await redis.get<string>(pageKey(l.id))
  if (existing) {
    try {
      await notion(`/pages/${existing}`, { method: 'PATCH', body: JSON.stringify({ properties, archived: false }) })
      return
    } catch (e) {
      // The row was deleted in Notion by hand: write a fresh one rather than fail forever.
      if (!(e instanceof NotionError && e.status === 404)) throw e
    }
  }
  const page = await notion<{ id: string }>('/pages', {
    method: 'POST',
    body: JSON.stringify({ parent: { database_id: cfg.databaseId }, properties }),
  })
  await redis.set(pageKey(l.id), page.id)
  await redis.sadd(NOTION_PAGES_INDEX, l.id)
}

/** Copies these lessons to Notion. Never throws: the outcome goes to NOTION_LAST_KEY. */
export async function syncLessonsToNotion(lessons: WorkLesson[]): Promise<{ synced: number; error?: string }> {
  if (!lessons.length || !notionTokenConfigured()) return { synced: 0 }
  const settings = await getWorkSettings()
  const cfg = configOf(settings)
  if (!cfg) return { synced: 0 }
  let synced = 0
  try {
    const { props } = await fetchNotionSchema(cfg.databaseId)
    const clients = new Map<string, WorkClient | undefined>()
    for (const l of lessons) {
      if (!clients.has(l.clientId)) clients.set(l.clientId, (await getWork('clients', l.clientId)) ?? undefined)
      await upsertOne(l, clients.get(l.clientId), cfg, props, settings)
      synced++
    }
    await record({ at: new Date().toISOString(), ok: true })
    return { synced }
  } catch (e) {
    const error = (e as Error).message
    console.warn('[worklog notion] sync failed:', error)
    await record({ at: new Date().toISOString(), ok: false, error, lessonId: lessons[synced]?.id })
    return { synced, error }
  }
}

/** A deleted lesson's Notion row is archived (Notion's bin), not destroyed. */
export async function archiveLessonsInNotion(lessonIds: string[]): Promise<void> {
  if (!lessonIds.length || !notionTokenConfigured()) return
  for (const id of lessonIds) {
    const page = await redis.get<string>(pageKey(id))
    if (!page) continue
    try {
      await notion(`/pages/${page}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) })
      await redis.pipeline([['DEL', pageKey(id)], ['SREM', NOTION_PAGES_INDEX, id]])
    } catch (e) {
      await record({ at: new Date().toISOString(), ok: false, error: (e as Error).message, lessonId: id })
    }
  }
}

/** lesson → Notion page links, for the backup: without them a restore would duplicate every row in Notion. */
export async function listNotionPageLinks(): Promise<{ lessonId: string; pageId: string }[]> {
  const ids = await redis.smembers(NOTION_PAGES_INDEX)
  const out: { lessonId: string; pageId: string }[] = []
  for (const id of ids) {
    const pageId = await redis.get<string>(pageKey(id))
    if (pageId) out.push({ lessonId: id, pageId })
  }
  return out
}

/** The lessons of a family, re-copied after its name changes (the row titles carry it). */
export async function resyncFamilyInNotion(clientId: string): Promise<void> {
  const lessons = (await listWork('lessons')).filter(l => l.clientId === clientId)
  await syncLessonsToNotion(lessons)
}
