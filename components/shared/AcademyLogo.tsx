// Amine Academy brand mark — a stylized brain (two hemispheres) with the
// bilingual monogram «A» + «أ» set inside it, plus a spark accent. The Latin A
// and Arabic alef together also read as "AI", nodding to the platform's
// AI-driven sessions. Single source of truth: change it here and it updates
// everywhere the component is used (landing, footer, parent portal, demo).
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
      {/* Brain hemispheres */}
      <g stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M21.2 7.5 C13.5 7 9.5 10.5 10 16 C7.5 17.5 8 21.5 10.8 22" />
        <path d="M22.8 7.5 C30.5 7 34.5 10.5 34 16 C36.5 17.5 36 21.5 33.2 22" />
        <path d="M15.5 11 C13.8 12.5 14.6 14.5 16.5 14.6" />
        <path d="M28.5 11 C30.2 12.5 29.4 14.5 27.5 14.6" />
      </g>
      <line x1="22" y1="8" x2="22" y2="14.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="1.4 1.4" />
      {/* Bilingual monogram — Latin A + Arabic أ */}
      <text x="17.3" y="33.5" fontFamily="Arial, Helvetica, sans-serif" fontSize="14.5" fontWeight="900" fill="white" textAnchor="middle">A</text>
      <text x="27" y="33.5" fontFamily="Tahoma, Arial, sans-serif" fontSize="13.5" fontWeight="900" fill="white" textAnchor="middle">أ</text>
      {/* Spark */}
      <g transform="translate(33.5, 5)">
        <path d="M3 0 L3.7 2.3 L6 3 L3.7 3.7 L3 6 L2.3 3.7 L0 3 L2.3 2.3 Z" fill="url(#aaLogoStar)" opacity="0.95" />
      </g>
    </svg>
  )
}
