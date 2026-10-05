'use client'
import { useEffect } from 'react'
import { dueReminders, endTime, lessonWho, type WorkLesson } from '@/lib/worklog'
import { readStorageJson, writeStorageJson } from '@/lib/safe-storage'
import { notificationState, showLessonNotification } from './notify'

// Lesson reminders while any dashboard page is open. Polls the upcoming
// lessons every few minutes and checks the clock every 30 seconds; a reminder
// already shown (same lesson, same date and time) is never shown twice, even
// across reloads. Staff accounts get 401 from the endpoint and the watcher
// simply stops — the ledger is the owner's alone.
const SENT_KEY = 'worklog-reminders-sent'
const POLL_MS = 5 * 60_000
const TICK_MS = 30_000

type Mini = { id: string; name: string; childName?: string; address?: string }

export default function ReminderWatcher() {
  useEffect(() => {
    let lessons: WorkLesson[] = []
    let clients = new Map<string, Mini>()
    let stopped = false

    async function poll() {
      if (stopped || notificationState() !== 'granted') return
      try {
        const res = await fetch('/api/admin/worklog?scope=upcoming', { cache: 'no-store' })
        if (res.status === 401) { stopped = true; return }
        if (!res.ok) return
        const data = await res.json() as { lessons: WorkLesson[]; clients: Mini[] }
        lessons = data.lessons
        clients = new Map(data.clients.map(c => [c.id, c]))
        tick()
      } catch { /* offline — try again next poll */ }
    }

    function tick() {
      if (stopped || !lessons.length) return
      const sent = readStorageJson<Record<string, number>>(SENT_KEY, {})
      const keyOf = (l: WorkLesson) => `${l.id}@${l.date}T${l.start}`
      const due = dueReminders(lessons, new Date(), new Set(lessons.filter(l => sent[keyOf(l)]).map(l => l.id)))
      if (!due.length) return
      const now = Date.now()
      for (const l of due) {
        const c = clients.get(l.clientId)
        const who = c ? lessonWho(l, { name: c.name, childName: c.childName }, ' · ') : 'حصة'
        showLessonNotification(`حصة ${l.start}–${endTime(l.start, l.durationMin)} · ${who}`, c?.address ? `📍 ${c.address}` : 'اضغط لفتح اليومية والطريق', l.id)
        sent[keyOf(l)] = now
      }
      // Forget anything older than a week so the record stays small.
      for (const [k, t] of Object.entries(sent)) if (now - t > 7 * 864e5) delete sent[k]
      writeStorageJson(SENT_KEY, sent)
    }

    poll()
    const p = setInterval(poll, POLL_MS)
    const t = setInterval(tick, TICK_MS)
    const onWake = () => { if (document.visibilityState === 'visible') poll() }
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('worklog:changed', poll)
    return () => {
      stopped = true
      clearInterval(p); clearInterval(t)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('worklog:changed', poll)
    }
  }, [])
  return null
}
