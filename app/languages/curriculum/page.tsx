import type { Metadata } from 'next'
import CurriculumClient from './CurriculumClient'

export const metadata: Metadata = {
  title: 'المنهج الفرنسي A1→C2 (CEFR) | أمين للّغات',
  description: 'مسار تعلّم الفرنسيّة المتدرّج وفق الإطار الأوروبي المرجعي المشترك للّغات (CEFR): أهداف قابلة للقياس، قواعد ومفردات لكل مستوى من A1 إلى C2.',
  alternates: { canonical: '/languages/curriculum' },
}

export default function CurriculumPage() {
  return <CurriculumClient />
}
