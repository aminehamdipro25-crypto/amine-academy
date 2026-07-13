// Validates a post-login `?redirect=` query value before it's ever handed to
// router.push()/window.location. Without this, an attacker can craft a link to
// our own trusted login page with an external target
// (/parent/login?redirect=https://evil.example) — the victim logs in for real
// on the real site (building trust), then lands on the attacker's page. Only
// a same-origin, single-leading-slash path is safe to follow.
export function safeRedirectPath(value: string | null, fallback: string): string {
  if (!value) return fallback
  // Reject absolute URLs, protocol-relative ("//host/…"), and backslash tricks
  // ("/\host/…") that browsers can still resolve as external.
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\') || value.includes('://')) {
    return fallback
  }
  return value
}
