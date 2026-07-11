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
          {/* Brand mark — the actual logo: brain with the two-tone A/أ monogram */}
          <svg width="128" height="128" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ogBg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7C5CFC" />
                <stop offset="55%" stopColor="#5B8EFF" />
                <stop offset="100%" stopColor="#2ABFA3" />
              </linearGradient>
              <linearGradient id="ogGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFDF5A" />
                <stop offset="100%" stopColor="#FF9A2E" />
              </linearGradient>
            </defs>
            <rect width="44" height="44" rx="13" fill="url(#ogBg)" />
            <path d="M22 6 C15.5 4.5 9.5 8 9.5 14 C6.5 15 6.5 20 9.5 22 C9 26 12.5 29 16.5 28 C17.5 31 26.5 31 27.5 28 C31.5 29 35 26 34.5 22 C37.5 20 37.5 15 34.5 14 C34.5 8 28.5 4.5 22 6 Z" fill="rgba(255,255,255,0.15)" />
            <path d="M12 33 L21.2 11" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16.3 26 L27.7 26" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d="M22.8 11 L32 33" stroke="url(#ogGold)" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="32.8" cy="9" r="2.2" fill="url(#ogGold)" />
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
