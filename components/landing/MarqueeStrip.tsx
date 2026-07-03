'use client'

const ITEMS = [
  { ar: 'رياضة معدّلة', tag: 'APA' },
  { ar: 'تعديل السلوك', tag: 'ABA' },
  { ar: 'تدريب معرفي', tag: 'CBT' },
  { ar: 'ADHD', tag: null },
  { ar: 'التوحد', tag: null },
  { ar: 'صعوبات التعلم', tag: null },
  { ar: '+200 عائلة', tag: null },
  { ar: '98% رضا', tag: null },
  { ar: 'جلسات تفاعلية', tag: null },
  { ar: 'تقارير ذكية', tag: null },
]

// Triplicate for seamless infinite loop
const TRACK = [...ITEMS, ...ITEMS, ...ITEMS]

export default function MarqueeStrip() {
  return (
    <div
      className="overflow-hidden py-3.5 select-none"
      style={{
        background: '#1E293B',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <style>{`
        @keyframes marquee-ltr {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-ltr 28s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="marquee-track" dir="ltr">
        {TRACK.map((item, i) => (
          <span key={i} className="flex items-center gap-3 px-5">
            {item.tag && (
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full tracking-widest"
                style={{ background: '#6B46F0', color: 'white' }}
              >
                {item.tag}
              </span>
            )}
            <span
              className="text-sm font-bold whitespace-nowrap"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              {item.ar}
            </span>
            <span style={{ color: 'rgba(107,70,240,0.6)', margin: '0 4px' }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
