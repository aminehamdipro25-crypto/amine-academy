import type { Metadata } from 'next'
import WorkLogApp from '@/components/worklog/WorkLogApp'

export const metadata: Metadata = { title: 'دفتر الحصص الخاصة' }

export default function WorkLogPage() {
  return <WorkLogApp />
}
