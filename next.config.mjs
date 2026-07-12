/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development'

// Daily.co's SDK does NOT confine itself to *.daily.co — the actual call
// engine bundle (call-machine-object-bundle.js) loads from *.dailywebrtc.net,
// a completely separate domain. Every prior video fix (room name, tokens,
// destroy-before-create) was masking this: the SDK's own bundle fetch was
// being blocked by our CSP the entire time ("Failed to load call object
// bundle... TypeError: Failed to fetch" is what a CSP-blocked fetch looks
// like from inside Daily's SDK — it doesn't surface as an explicit CSP
// console error in every browser). Allow it everywhere Daily is allowed.
const DAILY_ORIGINS = 'https://*.daily.co https://*.dailywebrtc.net'

// Google reCAPTCHA v3 (bot protection on public signup). The api.js loader +
// its challenge iframe come from www.google.com; supporting assets from
// www.gstatic.com. Only active when the reCAPTCHA env keys are set — but the
// CSP allowance is harmless when they aren't (nothing loads from these).
const RECAPTCHA_ORIGINS = 'https://www.google.com https://www.gstatic.com'

function buildCSP(frameSrc, mediaSrc) {
  return [
    "default-src 'self'",
    // Scripts: self + Next.js hydration inline scripts + Daily.co's call
    // machine bundle + wasm for Daily's audio processing
    `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline' 'wasm-unsafe-eval' ${DAILY_ORIGINS} ${RECAPTCHA_ORIGINS}`,
    // Styles: self + inline (Tailwind generates inline styles) + Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts: self + Google Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Images: self + data URIs (for SVG charts) + Cloudinary + Vercel Blob
    // (uploaded story-library page images)
    "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://*.public.blob.vercel-storage.com",
    // Connect: self + Upstash Redis + Daily.co signaling/call-engine fetches
    // + Pusher realtime (WebSocket + SockJS HTTP fallback + stats). Without
    // the Pusher origins here, the realtime WebSocket is CSP-blocked exactly
    // the way Daily's bundle fetch was.
    `connect-src 'self' https://*.upstash.io ${DAILY_ORIGINS} wss://*.daily.co wss://*.dailywebrtc.net wss://*.pusher.com https://*.pusher.com wss://*.pusherapp.com https://*.pusherapp.com ${RECAPTCHA_ORIGINS}`,
    `frame-src ${frameSrc}`,
    `media-src ${mediaSrc}`,
    // Workers: self + blob (for Next.js SW) + Daily's own workers
    `worker-src 'self' blob: ${DAILY_ORIGINS}`,
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
const ContentSecurityPolicy = buildCSP(`'self' ${DAILY_ORIGINS} https://www.youtube.com https://youtube.com https://www.google.com`, "'self' blob:")

// Session pages: the specialist can share ANY https:// URL via the in-session
// "محتوى" feature, and now audio URLs via "شارك رابط صوت" (both server-
// validated to http(s) only, dashboard-auth gated — see
// /api/sessions/[id]/content and /noise). frame-src/media-src must allow
// https: broadly here, or every non-YouTube share / non-self audio link is
// silently blocked by our OWN policy before it even reaches the target
// site's own rules.
const SessionContentSecurityPolicy = buildCSP("'self' https: https://*.daily.co", "'self' blob: https:")

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
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  // No .eslintrc in the project — skip ESLint during CI/Vercel builds
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
