'use client'
// Browser notifications for lesson reminders.
//
// Shown through the service worker when one is registered: Android Chrome
// throws on `new Notification()` from a page ("Illegal constructor"), so the
// page-level constructor is only the fallback for desktop browsers.

export type NotifyState = 'granted' | 'denied' | 'default' | 'unsupported'

export function notificationState(): NotifyState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission as NotifyState
}

export async function requestNotifications(): Promise<NotifyState> {
  if (notificationState() === 'unsupported') return 'unsupported'
  try { return (await Notification.requestPermission()) as NotifyState } catch { return notificationState() }
}

export async function showLessonNotification(title: string, body: string, tag: string): Promise<boolean> {
  if (notificationState() !== 'granted') return false
  const options: NotificationOptions = {
    body, tag, dir: 'rtl', lang: 'ar', icon: '/icon-192.png', badge: '/icon-192.png',
    data: { url: '/dashboard/work-log' },
  }
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
    if (reg) { await reg.showNotification(title, { ...options, requireInteraction: true } as NotificationOptions); return true }
  } catch { /* fall through to the page constructor */ }
  try {
    const n = new Notification(title, options)
    n.onclick = () => { window.focus(); window.location.href = '/dashboard/work-log'; n.close() }
    return true
  } catch {
    return false
  }
}
