'use client'
import { X, MonitorPlay } from 'lucide-react'
import { EXERCISES, VIDEO_LIBRARY } from '@/lib/session-constants'
import { extractYoutubeId } from '@/lib/session-helpers'

export default function VideoLibraryModal({
  videoModal,
  onClose,
  videoUrls,
  onChangeUrl,
  videoIframeLoading,
  onIframeLoad,
}: {
  videoModal: string | null
  onClose: () => void
  videoUrls: Record<string, string>
  onChangeUrl: (id: string, url: string) => void
  videoIframeLoading: boolean
  onIframeLoad: () => void
}) {
  if (!videoModal) return null
  const ex = EXERCISES.find(e => e.id === videoModal)
  const entry = VIDEO_LIBRARY[videoModal]
  if (!ex || !entry) return null

  const currentUrl = videoUrls[videoModal] || ''
  const customId = extractYoutubeId(currentUrl)
  const activeVideoId = customId || entry.videoId || null
  // Bundled library clips are curated to be short; hard-cap playback at 30s
  // so a long source video can never run past that, even if mis-tagged.
  const isLibraryClip = !customId && !!entry.videoId

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div
        className="relative rounded-3xl w-full max-w-xl mx-4 overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(10,8,22,0.97)',
          border: '1px solid rgba(124,92,252,0.2)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
          backdropFilter: 'blur(20px)',
        }}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="h-1" style={{ background: 'linear-gradient(90deg,#7C5CFC,#C084FC,#7C5CFC)' }} />

        <div className="px-5 pt-5 pb-4 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.3)' }}
          >
            {ex.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-black text-lg leading-tight">{ex.labelAr}</div>
            <div className="text-brand-400 text-xs font-bold mt-0.5">{ex.category}</div>
            <div className="text-white/50 text-xs mt-1 leading-relaxed">{entry.desc}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeVideoId ? (
          <div className="mx-5 mb-4">
            {isLibraryClip && (
              <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-brand-300">
                <span>⏱ مقطع مختصر — 30 ثانية كحد أقصى</span>
              </div>
            )}
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', background: '#000' }}>
              {videoIframeLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0a0816]">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-400/30 border-t-brand-400 animate-spin" />
                  <span className="text-white/40 text-[11px] font-bold">جارٍ تحميل الفيديو...</span>
                </div>
              )}
              <iframe
                key={activeVideoId}
                src={`https://www.youtube.com/embed/${activeVideoId}?rel=0&modestbranding=1${isLibraryClip ? '&end=30' : ''}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={onIframeLoad}
              />
            </div>
          </div>
        ) : (
          <div
            className="mx-5 mb-4 rounded-2xl flex flex-col items-center justify-center gap-3 py-8"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
          >
            <MonitorPlay className="w-10 h-10 text-white/20" />
            <p className="text-white/30 text-sm">الصق رابط يوتيوب لتشغيل الفيديو هنا</p>
          </div>
        )}

        <div className="px-5 mb-4">
          <div className="text-white/40 text-[10px] font-black uppercase tracking-wider mb-2">💡 نصائح التطبيق</div>
          <div className="grid grid-cols-2 gap-1.5">
            {entry.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-brand-500 text-[10px] font-black mt-0.5 flex-shrink-0">{i + 1}.</span>
                <span className="text-white/60 text-[10px] leading-snug">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={currentUrl}
              onChange={e => onChangeUrl(videoModal, e.target.value)}
              placeholder={entry.videoId ? 'استبدل الفيديو برابط يوتيوب آخر (اختياري)' : 'الصق رابط يوتيوب هنا...'}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-500/40"
              dir="ltr"
            />
            {currentUrl && (
              <button
                onClick={() => onChangeUrl(videoModal, '')}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
