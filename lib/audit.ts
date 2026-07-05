import { redis } from './redis'

export type AuditAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'session_save'
  | 'session_view'
  | 'report_view'
  | 'client_view'
  | 'data_export'
  | 'account_delete'
  | 'password_reset'
  | 'impersonate'
  | 'treatment_plan_save'

export interface AuditEntry {
  id:       string
  action:   AuditAction
  actorId:  string
  actorRole: string
  targetId?: string  // studentId / parentId being acted upon
  ip?:      string
  ts:       string
  meta?:    Record<string, string | number | boolean>
}

/**
 * Append an audit entry. Fire-and-forget safe — never throws.
 * Keeps last 2000 entries with 90-day TTL.
 */
export async function audit(entry: Omit<AuditEntry, 'id' | 'ts'>): Promise<void> {
  try {
    const full: AuditEntry = {
      ...entry,
      id: `AUD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      ts: new Date().toISOString(),
    }
    await redis.pipeline([
      ['LPUSH', 'audit-log', JSON.stringify(full)],
      ['LTRIM', 'audit-log', 0, 1999],
      ['EXPIRE', 'audit-log', 90 * 24 * 3600],
    ])
  } catch { /* never break callers */ }
}

export async function getAuditLog(limit = 100): Promise<AuditEntry[]> {
  try {
    const raw = await redis.lrange('audit-log', 0, limit - 1) as string[]
    return raw.map(r => JSON.parse(r) as AuditEntry)
  } catch { return [] }
}
