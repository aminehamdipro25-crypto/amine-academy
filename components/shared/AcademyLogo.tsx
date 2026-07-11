// Amine Academy brand mark — a stylized brain framing a bilingual monogram:
// one two-tone letterform that is BOTH a Latin "A" and an Arabic "أ". The white
// left stroke + crossbar read as the A; the gold right stroke is the alef and
// the gold dot above it is the hamza — together an unmistakable أ. Single source
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
      {/* Brain hemispheres — light frame */}
      <path d="M10 26 C10 21 12 17 17 15 C17 12 19 10 22 10" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M10 26 C10 29 11.5 31 14 31 L16 31" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M34 26 C34 21 32 17 27 15 C27 12 25 10 22 10" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M34 26 C34 29 32.5 31 30 31 L28 31" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Two-tone A / أ monogram */}
      <g fill="none" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 31 L21.4 15.5" stroke="#fff" />
        <path d="M17.4 25.6 L26.6 25.6" stroke="#fff" />
        <path d="M22.6 15.5 L30 31" stroke="url(#aaLogoGold)" />
      </g>
      <circle cx="31.4" cy="13.2" r="1.8" fill="url(#aaLogoGold)" />
    </svg>
  )
}
