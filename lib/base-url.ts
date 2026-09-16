// The absolute origin used to build links inside emails.
//
// This was resolved ad hoc at each call site, with three different env vars and
// two different fallbacks, which produced two genuinely broken links:
//
//   • the weekly progress email read NEXTAUTH_URL — a variable this project has
//     no reason to set, since auth here is HMAC sessions, not NextAuth. Unset,
//     it fell through to a literal that is not necessarily where the app lives.
//   • the payment notification read `NEXT_PUBLIC_APP_URL ?? ''`, so with that
//     variable unset the href became the relative string "/dashboard/payments".
//     A relative href in an email has nothing to resolve against — the link is
//     simply dead in the recipient's mail client.
//
// One resolver, and a runtime fallback that still works: Vercel always sets
// VERCEL_URL, so a forgotten env var now degrades to a deployment-specific but
// functioning link rather than to no link at all.

/** Used for canonical SEO metadata elsewhere in the app; the last resort here. */
const CANONICAL_ORIGIN = 'https://amine-academy.com'

export function baseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, '')

  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`

  return CANONICAL_ORIGIN
}
