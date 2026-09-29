import type { Metadata } from 'next'
import PlacementClient from './PlacementClient'

export const metadata: Metadata = {
  title: 'اختبار تحديد المستوى — الفرنسيّة | أمين للّغات',
  description: 'اختبار تحديد المستوى في الفرنسيّة وفق الإطار الأوروبي المرجعي المشترك للّغات (CEFR): A1 إلى C2 — نتيجة فوريّة معترف بها عالميّاً.',
  alternates: { canonical: '/languages/placement' },
}

export default function PlacementPage() {
  return <PlacementClient />
}
