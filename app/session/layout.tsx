import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'جلسة تفاعلية | أكاديمية أمين' }

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {children}
    </div>
  )
}
