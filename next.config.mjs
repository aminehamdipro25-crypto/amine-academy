/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development'

function buildCSP(frameSrc) {
  return [
    "default-src 'self'",
    // Scripts: self + Next.js hydration inline scripts + Daily.co call machine
    // (daily-js call-object mode loads its bundle from c.daily.co) + wasm for
    // Daily's audio processing
    `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline' 'wasm-unsafe-eval' https://*.daily.co`,
    // Styles: self + inline (Tailwind generates inline styles) + Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts: self + Google Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Images: self + data URIs (for SVG charts) + Cloudinary
    "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
    // Connect: self + Upstash Redis + Daily.co signaling
    "connect-src 'self' https://*.upstash.io https://*.daily.co wss://*.daily.co",
    `frame-src ${frameSrc}`,
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
    // Modern clickjacking defense (CSP-level) — kept alongside the legacy
    // X-Frame-Options header below for browsers that only honor one or the
    // other.
    "frame-ancestors 'self'",
  ].filter(Boolean).join('; ')
}

// General pages: only Daily.co + YouTube embeds are ever needed
const ContentSecurityPolicy = buildCSP("'self' https://*.daily.co https://www.youtube.com https://youtube.com")

// Session pages: the specialist can share ANY https:// URL via the in-session
// "محتوى" feature (server-validated to http(s) only, dashboard-auth gated —
// see /api/sessions/[id]/content). frame-src must allow https: broadly here,
// or every non-YouTube share is silently blocked by our OWN policy before it
// even reaches the target site's own framing rules.
const SessionContentSecurityPolicy = buildCSP("'self' https: https://*.daily.co")

// Permissions-Policy directives this app doesn't use at all — locked down
// everywhere, session pages included (camera/mic/display-capture are handled
// separately per-route below since /session/* genuinely needs them).
const UNUSED_PERMISSIONS =
  'usb=(), midi=(), payment=(), geolocation=(), interest-cohort=(), browsing-topics=(), ' +
  'accelerometer=(), gyroscope=(), magnetometer=(), fullscreen=(self), clipboard-write=(self)'

const baseHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Children-Privacy', value: 'COPPA-compliant' },
  // Isolates our pages' `window` from cross-origin popups/openers — blocks a
  // class of cross-origin-window (XS-Leak) attacks. Safe here: every
  // window.open() in the app opens a blank same-origin print window, never a
  // cross-origin popup that needs opener access.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // Prevents other sites from loading our resources directly (images, JSON
  // responses, etc.) cross-origin. Deliberately NOT setting
  // Cross-Origin-Embedder-Policy (require-corp) — that would also require
  // every third-party resource we load (Daily.co's call bundle/WASM/workers,
  // YouTube embeds, Google Fonts) to send a matching CORP/CORS header, which
  // isn't guaranteed and risks silently breaking the video call.
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
]

// Session page needs display-capture for screen sharing + the widened
// frame-src above — separate rule so no second Permissions-Policy/CSP header
// is ever merged by the browser
const sessionHeaders = [
  ...baseHeaders,
  { key: 'Content-Security-Policy', value: SessionContentSecurityPolicy },
  { key: 'Permissions-Policy', value: `camera=*, microphone=*, display-capture=*, ${UNUSED_PERMISSIONS}` },
]

// All other pages: restrictive CSP + lock down camera, mic, display-capture
const securityHeaders = [
  ...baseHeaders,
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'Permissions-Policy', value: `camera=(), microphone=(), display-capture=(), ${UNUSED_PERMISSIONS}` },
]

const nextConfig = {
  async headers() {
    return [
      // Session page: explicit display-capture=* (must come FIRST — more specific wins)
      { source: '/session/:path*', headers: sessionHeaders },
      // All other routes: restrictive permissions
      { source: '/((?!session).*)', headers: securityHeaders },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // No .eslintrc in the project — skip ESLint during CI/Vercel builds
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
