import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'أكاديمية أمين الدولية',
    short_name: 'أكاديمية أمين',
    description: 'منصة تفاعلية للرياضة المعدلة وعلم النفس لأطفال ADHD وطيف التوحد',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7c3aed',
    // 'any', not 'portrait': on a tablet the dashboard and the work log are
    // used in landscape, and a portrait lock made the installed app refuse to turn.
    orientation: 'any',
    lang: 'ar',
    dir: 'rtl',
    // PNG icons at 192 and 512 are REQUIRED for install (the "Add to Home
    // Screen" / install prompt) — Chrome does not accept an SVG-only icon set,
    // which is why the prompt never appeared before. Maskable variants let
    // Android apply its adaptive-icon shape without clipping the letter.
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    categories: ['education', 'health'],
    shortcuts: [
      {
        // Long-press the installed icon (Android) → straight into the work log.
        name: 'دفتر الحصص',
        short_name: 'دفتر الحصص',
        url: '/dashboard/work-log',
        description: 'اليومية والدفعات والمصاريف',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'تسجيل الدخول',
        url: '/parent/login',
        description: 'دخول بوابة أولياء الأمور',
      },
      {
        name: 'التسجيل',
        url: '/register',
        description: 'تسجيل حساب جديد',
      },
    ],
  }
}
