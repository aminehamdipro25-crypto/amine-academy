import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'أكاديمية أمين الدولية'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #6B46F0 0%, #9A7BFD 50%, #C4B5FD 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* White card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 32,
            padding: '60px 80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          {/* Brand mark — the actual logo: brain with the A/أ monogram */}
          <svg width="128" height="128" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ogBg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7C5CFC" />
                <stop offset="55%" stopColor="#5B8EFF" />
                <stop offset="100%" stopColor="#2ABFA3" />
              </linearGradient>
              <linearGradient id="ogStar" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFD93D" />
                <stop offset="100%" stopColor="#FF9A3C" />
              </linearGradient>
            </defs>
            <rect width="44" height="44" rx="13" fill="url(#ogBg)" />
            <path d="M10 26 C10 21 12 17 17 15 C17 12 19 10 22 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M10 26 C10 29 11.5 31 14 31 L16 31" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="11.5" cy="20" r="2" fill="rgba(255,255,255,0.25)" />
            <path d="M34 26 C34 21 32 17 27 15 C27 12 25 10 22 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M34 26 C34 29 32.5 31 30 31 L28 31" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="32.5" cy="20" r="2" fill="rgba(255,255,255,0.25)" />
            <path d="M15.3 30.5 L22 16 L28.7 30.5" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 25.3 L26 25.3" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M22 20.4 L22 24.6" stroke="white" strokeWidth="1.7" strokeLinecap="round" fill="none" />
            <path d="M20.8 19 L23.2 19 L22 20.6 Z" fill="white" />
            <g transform="translate(30, 7)">
              <path d="M3 0 L3.7 2.3 L6 3 L3.7 3.7 L3 6 L2.3 3.7 L0 3 L2.3 2.3 Z" fill="url(#ogStar)" />
            </g>
          </svg>

          {/* Title */}
          <div
            style={{
              color: 'white',
              fontSize: 64,
              fontWeight: 900,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            أكاديمية أمين
          </div>

          {/* Subtitle */}
          <div
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 28,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            منصة علاج وتعليم متكاملة للأطفال
          </div>

          {/* Pills */}
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {['توحد', 'عسر القراءة', 'اضطراب التركيز'].map(label => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  borderRadius: 100,
                  padding: '8px 24px',
                  fontSize: 22,
                  fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
