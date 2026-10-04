import 'server-only'
import { randomBytes, randomUUID } from 'crypto'
import { redis } from './redis'
import {
  CLIENT_COLORS, DEFAULT_SETTINGS,
  type WorkClient, type WorkExpense, type WorkLesson, type WorkPayment, type WorkSettings,
} from './worklog'

// Storage of the private-lesson ledger. One key per record plus a set of ids
// per collection — two edits to two different lessons never overwrite each
// other, which a single JSON document would allow.
//
// No record here carries an expiry (standing rule 11): this is a financial
// history, and an index that outlives its records reads as a shorter history.
//
//   worklog:client:<id>   worklog:clients    (set of ids)
//   worklog:lesson:<id>   worklog:lessons
//   worklog:payment:<id>  worklog:payments
//   worklog:expense:<id>  worklog:expenses
//   worklog:settings

export type WorkKind = 'clients' | 'lessons' | 'payments' | 'expenses'
type RecordOf = { clients: WorkClient; lessons: WorkLesson; payments: WorkPayment; expenses: WorkExpense }

const SINGULAR: Record<WorkKind, string> = { clients: 'client', lessons: 'lesson', payments: 'payment', expenses: 'expense' }
const recKey = (kind: WorkKind, id: string) => `worklog:${SINGULAR[kind]}:${id}`
const indexKey = (kind: WorkKind) => `worklog:${kind}`
const SETTINGS_KEY = 'worklog:settings'

export const WORK_KINDS: WorkKind[] = ['clients', 'lessons', 'payments', 'expenses']

export function newWorkId(kind: WorkKind): string {
  return `wl${SINGULAR[kind][0]}_${randomUUID()}`
}

export async function listWork<K extends WorkKind>(kind: K): Promise<RecordOf[K][]> {
  // Through the pipeline on purpose: redis.smembers answers [] on a failed
  // request, and an empty ledger is a believable lie. This throws instead.
  const [res] = await redis.pipeline([['SMEMBERS', indexKey(kind)]])
  if ((res as { error?: string }).error) throw new Error(`SMEMBERS ${kind}: ${(res as { error?: string }).error}`)
  const ids = Array.isArray(res.result) ? (res.result as string[]) : []
  if (!ids.length) return []
  const rows = await redis.mget<RecordOf[K]>(ids.map(id => recKey(kind, id)))
  const found = rows.filter(Boolean) as RecordOf[K][]
  // mget turns a failed request into nulls; every id missing at once is that, not data.
  if (!found.length) throw new Error(`MGET ${kind}: ${ids.length} ids, no records`)
  return found
}

export async function getWork<K extends WorkKind>(kind: K, id: string): Promise<RecordOf[K] | null> {
  return redis.get<RecordOf[K]>(recKey(kind, id))
}

export async function putWork<K extends WorkKind>(kind: K, row: RecordOf[K]): Promise<void> {
  // The record first, then the index: a failure between the two leaves an
  // unreferenced record, never an id pointing at nothing.
  await redis.set(recKey(kind, row.id), row)
  await redis.pipeline([['SADD', indexKey(kind), row.id]])
}

export async function putManyWork<K extends WorkKind>(kind: K, rows: RecordOf[K][]): Promise<void> {
  if (!rows.length) return
  await redis.pipeline(rows.map(r => ['SET', recKey(kind, r.id), JSON.stringify(r)]))
  await redis.pipeline([['SADD', indexKey(kind), ...rows.map(r => r.id)]])
}

export async function deleteWork(kind: WorkKind, ids: string[]): Promise<void> {
  if (!ids.length) return
  await redis.pipeline([
    ['SREM', indexKey(kind), ...ids],
    ['DEL', ...ids.map(id => recKey(kind, id))],
  ])
}

export async function getWorkSettings(): Promise<WorkSettings> {
  const s = await redis.get<Partial<WorkSettings>>(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) }
}

export async function saveWorkSettings(s: WorkSettings): Promise<void> {
  await redis.set(SETTINGS_KEY, s)
}

export function newCalendarToken(): string {
  return randomBytes(24).toString('base64url')
}

/** The next family colour: the least-used one, in palette order. */
export function nextClientColor(clients: WorkClient[]): string {
  const used = new Map<string, number>()
  for (const c of clients) used.set(c.color, (used.get(c.color) ?? 0) + 1)
  return [...CLIENT_COLORS].sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0))[0]
}

export async function loadAllWork() {
  const [clients, lessons, payments, expenses, settings] = await Promise.all([
    listWork('clients'), listWork('lessons'), listWork('payments'), listWork('expenses'), getWorkSettings(),
  ])
  return { clients, lessons, payments, expenses, settings }
}
