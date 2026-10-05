import type { Metadata } from 'next'
import WorkLogApp from '@/components/worklog/WorkLogApp'

// Its own web-app manifest: "Add to Home Screen" from THIS page installs a
// separate «دفتر الحصص» icon that opens straight here, instead of the
// academy's home page. Same origin and scope, so the session cookie and the
// service worker are shared with the rest of the dashboard.
export const metadata: Metadata = {
  title: 'دفتر الحصص الخاصة',
  manifest: '/worklog.webmanifest',
  appleWebApp: { capable: true, title: 'دفتر الحصص', statusBarStyle: 'default' },
}

export default function WorkLogPage() {
  return <WorkLogApp />
}
