/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development'

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Scripts: self + Next.js hydration inline scripts + no unsafe-eval
  `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline'`,
  // Styles: self + inline (Tailwind generates inline styles) + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs (for SVG charts) + Cloudinary
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
  // Connect: self + Upstash Redis (via server-side only, but kept for safety) + Jitsi signaling
  "connect-src 'self' https://*.upstash.io https://meet.jit.si wss://meet.jit.si",
  // Frames: Jitsi Meet only
  "frame-src 'self' https://meet.jit.si",
  // Media: self
  "media-src 'self' blob:",
  // Workers: self + blob (for Next.js SW)
  "worker-src 'self' blob:",
  // Object: none (no Flash, no plugins)
  "object-src 'none'",
  // Base URI: self
  "base-uri 'self'",
  // Form action: self
  "form-action 'self'",
].filter(Boolean).join('; ')

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  // COPPA compliance marker
  { key: 'X-Children-Privacy', value: 'COPPA-compliant' },
]

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
}

export default nextConfig
