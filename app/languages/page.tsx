import type { Metadata } from 'next'
import LanguagesLanding from './LanguagesLanding'

export const metadata: Metadata = {
  title: 'أمين للّغات — تعلّم اللغات بمنهجيّة عالميّة (CEFR)',
  description: 'أمين للّغات: تعلّم الفرنسيّة (ولغات أخرى قريباً) مع أساتذة مختصّين، مسار شخصي وفق الإطار الأوروبي المرجعي المشترك للّغات CEFR، حصص مباشرة ومتابعة دقيقة للتقدّم.',
  alternates: { canonical: '/languages' },
  openGraph: {
    title: 'أمين للّغات — Amine Languages',
    description: 'تعلّم اللغات بمنهجيّة عالميّة CEFR — نبدأ بالفرنسيّة.',
    url: '/languages',
  },
}

export default function LanguagesPage() {
  return <LanguagesLanding />
}
