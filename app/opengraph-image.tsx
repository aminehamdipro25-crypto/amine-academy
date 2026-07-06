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
          {/* Brain icon placeholder */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
            }}
          >
            🧠
          </div>

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
