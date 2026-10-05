'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  type WorkClient, type WorkExpense, type WorkLesson, type WorkPayment, type WorkSettings,
} from '@/lib/worklog'

export interface WorkData {
  clients: WorkClient[]
  lessons: WorkLesson[]
  payments: WorkPayment[]
  expenses: WorkExpense[]
  settings: WorkSettings
}
type Kind = 'clients' | 'lessons' | 'payments' | 'expenses'

/** Tells the reminder watcher (mounted on every dashboard page) to refresh now. */
function changed() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('worklog:changed'))
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || 'تعذّر الاتصال بالخادم')
  return data as T
}

/**
 * The ledger state and every mutation. Writes are confirmed by the server
 * before the screen changes — except quick status taps, which update at once
 * and roll back if the server refuses, so marking a lesson «done» in the car
 * never waits on the network but never lies about being saved either.
 */
export function useWorkLogState() {
  const [data, setData] = useState<WorkData>({ clients: [], lessons: [], payments: [], expenses: [], settings: DEFAULT_SETTINGS })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const dataRef = useRef(data)
  dataRef.current = data

  const reload = useCallback(async () => {
    try {
      const d = await call<WorkData>('/api/admin/worklog', { cache: 'no-store' })
      setData(d)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const create = useCallback(async <T,>(kind: Kind, body: object): Promise<T> => {
    const row = await call<T>(`/api/admin/worklog/${kind}`, { method: 'POST', body: JSON.stringify(body) })
    setData(d => ({ ...d, [kind]: [...d[kind], ...(Array.isArray(row) ? row : [row])] }))
    changed()
    return row
  }, [])

  const update = useCallback(async <T extends { id: string },>(kind: Kind, id: string, body: object, optimistic = false): Promise<T> => {
    const before = (dataRef.current[kind] as { id: string }[]).find(r => r.id === id)
    if (optimistic) {
      setData(d => ({ ...d, [kind]: (d[kind] as { id: string }[]).map(r => (r.id === id ? { ...r, ...body } : r)) }))
    }
    try {
      const row = await call<T>(`/api/admin/worklog/${kind}/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
      setData(d => ({ ...d, [kind]: (d[kind] as { id: string }[]).map(r => (r.id === id ? row : r)) }))
      changed()
      return row
    } catch (e) {
      if (optimistic && before) setData(d => ({ ...d, [kind]: (d[kind] as { id: string }[]).map(r => (r.id === id ? before : r)) }))
      throw e
    }
  }, [])

  /** Edit a lesson and every scheduled lesson after it in its weekly series. */
  const updateSeries = useCallback(async (id: string, body: object): Promise<WorkLesson[]> => {
    const rows = await call<WorkLesson[]>(`/api/admin/worklog/lessons/${id}?scope=future`, { method: 'PATCH', body: JSON.stringify(body) })
    const byId = new Map(rows.map(r => [r.id, r]))
    setData(d => ({ ...d, lessons: d.lessons.map(l => byId.get(l.id) ?? l) }))
    changed()
    return rows
  }, [])

  const remove = useCallback(async (kind: Kind, id: string, scope?: 'future') => {
    const res = await call<{ deleted: string[] }>(`/api/admin/worklog/${kind}/${id}${scope ? `?scope=${scope}` : ''}`, { method: 'DELETE' })
    const gone = new Set(res.deleted)
    setData(d => ({ ...d, [kind]: (d[kind] as { id: string }[]).filter(r => !gone.has(r.id)) }))
    changed()
    return res.deleted.length
  }, [])

  const saveSettings = useCallback(async (body: object) => {
    const s = await call<WorkSettings>('/api/admin/worklog/settings', { method: 'PUT', body: JSON.stringify(body) })
    setData(d => ({ ...d, settings: s }))
    return s
  }, [])

  const clientsById = useMemo(() => new Map(data.clients.map(c => [c.id, c])), [data.clients])

  return { ...data, data, loading, error, reload, create, update, updateSeries, remove, saveSettings, clientsById }
}

export type WorkLogCtx = ReturnType<typeof useWorkLogState>
export const WorkLogContext = createContext<WorkLogCtx | null>(null)
export function useWorkLog(): WorkLogCtx {
  const v = useContext(WorkLogContext)
  if (!v) throw new Error('useWorkLog outside provider')
  return v
}

export function clientLabel(c: WorkClient | undefined): string {
  if (!c) return 'عائلة محذوفة'
  return c.childName ? `${c.childName} · ${c.name}` : c.name
}
