import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n'
import { AccessibilityProvider } from '@/lib/accessibility'
import ScrollToTop from '@/components/ScrollToTop'
import PWARegister from '@/components/PWARegister'
import InstallBanner from '@/components/InstallBanner'
import AccessibilityWidget from '@/components/AccessibilityWidget'
import ErrorMonitorInstaller from '@/components/ErrorMonitorInstaller'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://amine-academy.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#7c3aed',
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'أكاديمية أمين الدولية | ADHD & Autism — رياضة معدلة وعلم نفس',
    template: '%s | أكاديمية أمين',
  },
  description: 'منصة تفاعلية عالمية للرياضة المعدلة وعلم النفس لأطفال وشباب اضطراب ADHD وطيف التوحد. برامج متخصصة من 5 إلى 22 سنة بإشراف الأستاذ أمين.',
  keywords: [
    'ADHD', 'أطفال ADHD', 'طيف التوحد', 'Autism', 'رياضة معدلة',
    'علم النفس الرياضي', 'تمارين للتوحد', 'أكاديمية أمين', 'Amine Academy',
    'فرط الحركة', 'تشتت الانتباه', 'تمارين التركيز', 'APA',
  ],
  openGraph: {
    type: 'website',
    locale: 'ar_TN',
    url: BASE_URL,
    siteName: 'أكاديمية أمين الدولية',
  },
  twitter: { card: 'summary_large_image' },
  // Home-screen / tab icons. iOS Safari uses `apple`; it doesn't read the web
  // manifest, so the apple-touch-icon must be declared here for "Add to Home
  // Screen" on iPhone/iPad to show the real icon instead of a screenshot.
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'أكاديمية أمين',
    statusBarStyle: 'default',
  },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'أكاديمية أمين الدولية',
  alternateName: 'Amine Academy',
  url: BASE_URL,
  description: 'منصة تفاعلية للرياضة المعدلة وعلم النفس لأطفال ADHD وطيف التوحد',
  founder: { '@type': 'Person', name: 'الأستاذ أمين' },
  educationalCredentialAwarded: 'برنامج تطوير حركي ونفسي',
  audience: {
    '@type': 'Audience',
    audienceType: 'أطفال وشباب ADHD وطيف التوحد (5-22 سنة)',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        {/* GA stub — synchronous to prevent race condition */}
        {GA_ID && (
          <script dangerouslySetInnerHTML={{ __html:
            `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}`
          }} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-cairo antialiased">
        <AccessibilityProvider>
        <LanguageProvider>
        {children}
        </LanguageProvider>
        <ScrollToTop />
        <PWARegister />
        <InstallBanner />
        <AccessibilityWidget />
        <ErrorMonitorInstaller />
        </AccessibilityProvider>
        {GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <script dangerouslySetInnerHTML={{ __html: `
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            ` }} />
          </>
        )}
      </body>
    </html>
  )
}
