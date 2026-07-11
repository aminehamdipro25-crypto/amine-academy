// Amine Academy brand mark — a bold bilingual monogram that is at once a Latin
// "A" and an Arabic "أ": the white left stroke + crossbar read as the A; the
// gold right stroke is the alef and the gold dot its hamza. A soft brain
// silhouette sits behind it for brand continuity. Kept deliberately bold and
// simple so it reads cleanly at every size (favicon → app icon). Single source
// of truth: change it here and it updates everywhere the component is used.
export default function AcademyLogo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aaLogoBg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C5CFC" />
          <stop offset="55%" stopColor="#5B8EFF" />
          <stop offset="100%" stopColor="#2ABFA3" />
        </linearGradient>
        <linearGradient id="aaLogoGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFDF5A" />
          <stop offset="100%" stopColor="#FF9A2E" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="13" fill="url(#aaLogoBg)" />
      {/* Soft brain silhouette */}
      <path d="M22 6 C15.5 4.5 9.5 8 9.5 14 C6.5 15 6.5 20 9.5 22 C9 26 12.5 29 16.5 28 C17.5 31 26.5 31 27.5 28 C31.5 29 35 26 34.5 22 C37.5 20 37.5 15 34.5 14 C34.5 8 28.5 4.5 22 6 Z" fill="rgba(255,255,255,0.15)" />
      {/* Bold two-tone A / أ monogram */}
      <g fill="none" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 33 L21.2 11" stroke="#fff" />
        <path d="M16.3 26 L27.7 26" stroke="#fff" />
        <path d="M22.8 11 L32 33" stroke="url(#aaLogoGold)" />
      </g>
      <circle cx="32.8" cy="9" r="2.2" fill="url(#aaLogoGold)" />
    </svg>
  )
}
