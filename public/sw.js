const CACHE = 'amine-academy-v1'
const SHELL = ['/', '/parent/login', '/register', '/offline']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  // Skip API calls and Next.js internals
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return res
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/offline')))
  )
})

// Lesson reminders (دفتر الحصص) are shown through the service worker because
// Android Chrome refuses `new Notification()` from a page. Tapping one focuses
// an open dashboard tab, or opens the ledger.
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const target = (e.notification.data && e.notification.data.url) || '/dashboard/work-log'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (new URL(c.url).pathname.startsWith('/dashboard') && 'focus' in c) {
          if ('navigate' in c) c.navigate(target).catch(() => {})
          return c.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
