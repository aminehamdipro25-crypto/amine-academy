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
    orientation: 'portrait',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['education', 'health'],
    shortcuts: [
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
