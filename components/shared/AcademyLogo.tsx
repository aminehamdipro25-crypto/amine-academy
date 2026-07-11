// Amine Academy brand mark — the original stylized brain, with a bold outline
// «A» in its center and the Arabic «أ» nested inside the A's triangle (bilingual
// monogram). Single source of truth: change it here and it updates everywhere
// the component is used (landing, footer, parent portal, demo, dashboard).
export default function AcademyLogo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aaLogoBg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C5CFC" />
          <stop offset="55%" stopColor="#5B8EFF" />
          <stop offset="100%" stopColor="#2ABFA3" />
        </linearGradient>
        <linearGradient id="aaLogoStar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD93D" />
          <stop offset="100%" stopColor="#FF9A3C" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="13" fill="url(#aaLogoBg)" />
      {/* Brain hemispheres (the original design) */}
      <path d="M10 26 C10 21 12 17 17 15 C17 12 19 10 22 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M10 26 C10 29 11.5 31 14 31 L16 31" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="11.5" cy="20" r="2" fill="rgba(255,255,255,0.25)" />
      <path d="M34 26 C34 21 32 17 27 15 C27 12 25 10 22 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M34 26 C34 29 32.5 31 30 31 L28 31" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="32.5" cy="20" r="2" fill="rgba(255,255,255,0.25)" />
      {/* Outline A with the Arabic أ nested inside its triangle */}
      <g stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.3 30.5 L22 16 L28.7 30.5" />
        <path d="M18 25.3 L26 25.3" />
      </g>
      <line x1="22" y1="20.4" x2="22" y2="24.6" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M20.8 19 L23.2 19 L22 20.6 Z" fill="white" />
      {/* Spark */}
      <g transform="translate(30, 7)">
        <path d="M3 0 L3.7 2.3 L6 3 L3.7 3.7 L3 6 L2.3 3.7 L0 3 L2.3 2.3 Z" fill="url(#aaLogoStar)" opacity="0.95" />
      </g>
    </svg>
  )
}
