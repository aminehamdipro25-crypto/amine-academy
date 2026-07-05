'use client'
import { Video, PenLine } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { PROMPT_CARDS } from '@/lib/session-constants'
import { ToolbarPopover, formatTime } from '@/lib/session-helpers'

type NoiseMode = 'white' | 'rain' | 'focus' | 'calm' | 'theta'

const NOISE_MODES = [
  { key: 'calm',  label: 'أمبيانت هادئ',  emoji: '🎐' },
  { key: 'theta', label: 'ثيتا للاسترخاء', emoji: '🌙' },
  { key: 'focus', label: 'غاما 40Hz',     emoji: '🧠' },
  { key: 'rain',  label: 'مطر',           emoji: '🌧️' },
  { key: 'white', label: 'ضوضاء بيضاء',  emoji: '🌊' },
] as const

const NOISE_DESCRIPTIONS: Record<NoiseMode, string> = {
  calm:  'نغمات هادئة متجانسة بتذبذب يحاكي التنفس البطيء (~6 أنفاس/د)',
  theta: 'نبضة ثنائية (binaural) بتردد ~6Hz (ثيتا) — يلزم سماعات الرأس',
  focus: 'نبضة ثنائية (binaural) بتردد 40Hz (غاما) — يلزم سماعات الرأس',
  rain:  'صوت مطر طبيعي مهدئ لتغطية المشتتات الصوتية',
  white: 'الضوضاء البيضاء تُحسّن التركيز لدى ADHD — موثّق علمياً',
}

export default function SessionToolbar({
  toolbarRef,
  chromeHidden,
  jitsiUrl,
  jitsiEmbedded,
  onToggleJitsiEmbedded,
  showWhiteboard,
  onToggleWhiteboard,
  promptBtnRef,
  promptPickerOpen,
  onTogglePromptPicker,
  onClosePromptPicker,
  promptCards,
  onSelectPromptCard,
  timerBtnRef,
  timerPickerOpen,
  onToggleTimerPicker,
  onCloseTimerPicker,
  showStudentTimer,
  studentTimerLeft,
  onStartStudentTimer,
  onStopStudentTimer,
  noiseBtnRef,
  showNoisePanel,
  onToggleNoisePanel,
  onCloseNoisePanel,
  noiseRunning,
  noiseSecsLeft,
  noiseMode,
  onSetNoiseMode,
  onStartNoise,
  onStopNoise,
  kidMode,
  onToggleKidMode,
  focusMode,
  onToggleFocusMode,
  difficulty,
  onSetDifficulty,
  hasResults,
  onPrintReport,
  onLockSession,
}: {
  toolbarRef: React.RefObject<HTMLDivElement>
  chromeHidden: boolean
  jitsiUrl: string | null
  jitsiEmbedded: boolean
  onToggleJitsiEmbedded: () => void
  showWhiteboard: boolean
  onToggleWhiteboard: () => void
  promptBtnRef: React.RefObject<HTMLDivElement>
  promptPickerOpen: boolean
  onTogglePromptPicker: () => void
  onClosePromptPicker: () => void
  promptCards: typeof PROMPT_CARDS
  onSelectPromptCard: (card: typeof PROMPT_CARDS[number]) => void
  timerBtnRef: React.RefObject<HTMLDivElement>
  timerPickerOpen: boolean
  onToggleTimerPicker: () => void
  onCloseTimerPicker: () => void
  showStudentTimer: boolean
  studentTimerLeft: number
  onStartStudentTimer: (seconds: number) => void
  onStopStudentTimer: () => void
  noiseBtnRef: React.RefObject<HTMLDivElement>
  showNoisePanel: boolean
  onToggleNoisePanel: () => void
  onCloseNoisePanel: () => void
  noiseRunning: boolean
  noiseSecsLeft: number
  noiseMode: NoiseMode
  onSetNoiseMode: (mode: NoiseMode) => void
  onStartNoise: () => void
  onStopNoise: () => void
  kidMode: boolean
  onToggleKidMode: () => void
  focusMode: boolean
  onToggleFocusMode: () => void
  difficulty: 1 | 2 | 3
  onSetDifficulty: (d: 1 | 2 | 3) => void
  hasResults: boolean
  onPrintReport: () => void
  onLockSession: () => void
}) {
  // ── Custom audio upload (local state — no session persistence needed) ──
  const [customTrack, setCustomTrack] = useState<{ name: string; url: string } | null>(null)
  const [customPlaying, setCustomPlaying] = useState(false)
  const [customVolume, setCustomVolume] = useState(0.7)
  const [customLooping, setCustomLooping] = useState(true)
  const customAudioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Cleanup object URL on track change or unmount
  useEffect(() => {
    return () => {
      if (customTrack) URL.revokeObjectURL(customTrack.url)
    }
  }, [customTrack])

  // Sync volume + loop to audio element
  useEffect(() => {
    if (customAudioRef.current) {
      customAudioRef.current.volume = customVolume
      customAudioRef.current.loop = customLooping
    }
  }, [customVolume, customLooping])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Stop old track
    if (customAudioRef.current) {
      customAudioRef.current.pause()
      customAudioRef.current = null
    }
    if (customTrack) URL.revokeObjectURL(customTrack.url)
    // Stop synthesis if running
    if (noiseRunning) onStopNoise()

    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    audio.volume = customVolume
    audio.loop = customLooping
    audio.addEventListener('ended', () => { if (!customLooping) setCustomPlaying(false) })
    customAudioRef.current = audio
    setCustomTrack({ name: file.name.replace(/\.[^.]+$/, ''), url })
    setCustomPlaying(false)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function toggleCustomPlay() {
    if (!customAudioRef.current) return
    if (customPlaying) {
      customAudioRef.current.pause()
      setCustomPlaying(false)
    } else {
      // Stop synthesis when playing custom
      if (noiseRunning) onStopNoise()
      customAudioRef.current.play()
      setCustomPlaying(true)
    }
  }

  function stopCustom() {
    if (!customAudioRef.current) return
    customAudioRef.current.pause()
    customAudioRef.current.currentTime = 0
    setCustomPlaying(false)
  }

  function removeCustomTrack() {
    stopCustom()
    if (customTrack) URL.revokeObjectURL(customTrack.url)
    customAudioRef.current = null
    setCustomTrack(null)
  }

  // If synthesis starts, pause custom audio
  useEffect(() => {
    if (noiseRunning && customPlaying) {
      customAudioRef.current?.pause()
      setCustomPlaying(false)
    }
  }, [noiseRunning])

  return (
    <div
      ref={toolbarRef}
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${chromeHidden ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
    >
    <div className="overflow-hidden min-h-0">
    <div
      className="bg-white border-b border-brand-100 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

      {/* Group 1 — Camera */}
      {jitsiUrl && (
        <button
          onClick={onToggleJitsiEmbedded}
          className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all flex-shrink-0 ${
            jitsiEmbedded
              ? 'bg-green-600 text-white ring-1 ring-green-400/50'
              : 'bg-surface-page hover:bg-brand-50 text-gray-500'
          }`}
          title="المقابلة المرئية"
        >
          <Video className="w-3.5 h-3.5" />
          {jitsiEmbedded ? '● مقابلة' : 'مقابلة'}
        </button>
      )}

      <div className="w-px h-5 bg-brand-100 flex-shrink-0" />

      {/* Group 2 — Drawing & Cards & Timer */}
      <button
        onClick={onToggleWhiteboard}
        className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all flex-shrink-0 ${
          showWhiteboard
            ? 'bg-amber-500 text-white ring-1 ring-amber-400/50'
            : 'bg-surface-page hover:bg-brand-50 text-gray-500'
        }`}
        title="السبورة التفاعلية"
      >
        <PenLine className="w-3.5 h-3.5" />
        سبورة
      </button>

      <div className="relative flex-shrink-0" ref={promptBtnRef}>
        <button
          onClick={onTogglePromptPicker}
          className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all ${
            promptPickerOpen
              ? 'bg-purple-500 text-white ring-1 ring-purple-400/50'
              : 'bg-surface-page hover:bg-brand-50 text-gray-500'
          }`}
          title="بطاقات التحفيز"
        >
          🃏 بطاقة
        </button>
      </div>
      <ToolbarPopover anchorRef={promptBtnRef} open={promptPickerOpen} onClose={onClosePromptPicker}>
        <div
          className="rounded-2xl overflow-hidden shadow-2xl bg-white border border-brand-100"
          style={{ minWidth: 200 }}
          dir="rtl"
        >
          {promptCards.map(card => (
            <button
              key={card.id}
              onClick={() => onSelectPromptCard(card)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-right"
            >
              <span className="text-2xl">{card.emoji}</span>
              <span className="text-gray-800 font-black text-sm">{card.text}</span>
            </button>
          ))}
        </div>
      </ToolbarPopover>

      <div className="relative flex-shrink-0" ref={timerBtnRef}>
        <button
          onClick={onToggleTimerPicker}
          className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all ${
            showStudentTimer
              ? 'bg-orange-500 text-white ring-1 ring-orange-400/50'
              : 'bg-surface-page hover:bg-brand-50 text-gray-500'
          }`}
          title="مؤقت الطالب"
        >
          ⏱ {showStudentTimer ? formatTime(studentTimerLeft) : 'مؤقت'}
        </button>
      </div>
      <ToolbarPopover anchorRef={timerBtnRef} open={timerPickerOpen} onClose={onCloseTimerPicker}>
        <div
          className="rounded-2xl p-3 shadow-2xl bg-white border border-brand-100"
          style={{ minWidth: 180 }}
          dir="rtl"
        >
          <p className="text-gray-400 text-[10px] font-black mb-2">اختر مدة المؤقت</p>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {([[60,'1 دقيقة'],[120,'2 دقيقة'],[180,'3 دقائق'],[300,'5 دقائق'],[600,'10 دقائق'],[900,'15 دقيقة']] as [number,string][]).map(([s,l]) => (
              <button
                key={s}
                onClick={() => onStartStudentTimer(s as number)}
                className="py-2 rounded-xl text-xs font-black text-gray-700 bg-surface-page transition-all hover:ring-1 hover:ring-orange-400"
              >
                {l as string}
              </button>
            ))}
          </div>
          {showStudentTimer && (
            <button
              onClick={onStopStudentTimer}
              className="w-full py-1.5 rounded-xl text-[10px] font-black text-red-500 bg-red-50 transition-all"
            >
              إيقاف المؤقت
            </button>
          )}
        </div>
      </ToolbarPopover>

      {/* White noise / focus music + custom upload */}
      <div className="relative flex-shrink-0" ref={noiseBtnRef}>
        <button
          onClick={onToggleNoisePanel}
          className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all ${
            noiseRunning || customPlaying
              ? 'bg-cyan-600 text-white ring-1 ring-cyan-400/50'
              : 'bg-surface-page hover:bg-brand-50 text-gray-500'
          }`}
          title="موسيقى وترددات الاسترخاء والتركيز"
        >
          🎵 {noiseRunning ? formatTime(noiseSecsLeft) : customPlaying ? '♪ يعزف' : 'موسيقى'}
        </button>
      </div>
      <ToolbarPopover anchorRef={noiseBtnRef} open={showNoisePanel} onClose={onCloseNoisePanel}>
        <div
          className="rounded-2xl p-3 shadow-2xl bg-white border border-cyan-100"
          style={{ minWidth: 250 }}
          dir="rtl"
        >
          {/* ── Section A: Custom file upload ── */}
          <p className="text-gray-400 text-[10px] font-black mb-2 flex items-center gap-1">
            📁 موسيقى من جهازك
          </p>

          {!customTrack ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 mb-3 rounded-xl text-xs font-black border-2 border-dashed border-cyan-200 text-cyan-600 hover:border-cyan-400 hover:bg-cyan-50 transition-all flex items-center justify-center gap-2"
            >
              ⬆ رفع ملف صوتي (MP3 / WAV / OGG)
            </button>
          ) : (
            <div className="mb-3 bg-cyan-50 rounded-xl p-2.5 border border-cyan-100">
              {/* Track name */}
              <div className="text-cyan-800 font-black text-[11px] truncate mb-2" title={customTrack.name}>
                🎵 {customTrack.name}
              </div>
              {/* Controls row */}
              <div className="flex items-center gap-1.5 mb-2">
                <button
                  onClick={toggleCustomPlay}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                    customPlaying
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
                  }`}
                >
                  {customPlaying ? '⏸ إيقاف مؤقت' : '▶ تشغيل'}
                </button>
                <button
                  onClick={stopCustom}
                  className="py-1.5 px-2 rounded-lg text-xs font-black bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
                  title="إيقاف وإعادة للبداية"
                >
                  ⏹
                </button>
                <button
                  onClick={removeCustomTrack}
                  className="py-1.5 px-2 rounded-lg text-xs font-black bg-white text-red-400 border border-red-100 hover:bg-red-50 transition-all"
                  title="حذف المقطع"
                >
                  ✕
                </button>
              </div>
              {/* Volume slider */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-400 flex-shrink-0">🔊</span>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={customVolume}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    setCustomVolume(v)
                    if (customAudioRef.current) customAudioRef.current.volume = v
                  }}
                  className="flex-1 h-1 accent-cyan-500 cursor-pointer"
                />
                <span className="text-[9px] text-gray-400 w-7 text-left">{Math.round(customVolume * 100)}%</span>
              </div>
              {/* Loop toggle */}
              <button
                onClick={() => {
                  const next = !customLooping
                  setCustomLooping(next)
                  if (customAudioRef.current) customAudioRef.current.loop = next
                }}
                className={`mt-1.5 w-full py-1 rounded-lg text-[10px] font-black transition-all ${
                  customLooping ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-50 text-gray-400'
                }`}
              >
                🔁 {customLooping ? 'تكرار مفعّل' : 'تكرار معطّل'}
              </button>
              {/* Change track */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 w-full py-1 rounded-lg text-[10px] font-black text-gray-400 hover:text-gray-600 transition-all"
              >
                ↩ تغيير المقطع
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* ── Section B: Generated sounds ── */}
          <div className="border-t border-gray-100 pt-2.5 mt-0.5">
            <p className="text-gray-400 text-[10px] font-black mb-2 flex items-center gap-1">
              🎵 أصوات مولّدة <span className="text-cyan-600">(5 دقائق)</span>
            </p>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {NOISE_MODES.map(m => (
                <button
                  key={m.key}
                  onClick={() => {
                    onSetNoiseMode(m.key)
                    if (noiseRunning) onStopNoise()
                    // Also stop custom if switching to synthesis
                    if (customPlaying) {
                      customAudioRef.current?.pause()
                      setCustomPlaying(false)
                    }
                  }}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black text-center transition-all leading-tight ${
                    noiseMode === m.key
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 bg-surface-page'
                  }`}
                >
                  <div className="text-base mb-0.5">{m.emoji}</div>
                  <div>{m.label}</div>
                </button>
              ))}
            </div>

            {noiseRunning && (
              <div className="text-center mb-3">
                <div className="text-cyan-600 font-black text-xl ltr-num">{formatTime(noiseSecsLeft)}</div>
                <div className="h-1.5 bg-surface-page rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-cyan-400 to-cyan-600 rounded-full transition-all duration-1000"
                    style={{ width: `${((5 * 60 - noiseSecsLeft) / (5 * 60)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (noiseRunning) {
                  onStopNoise()
                } else {
                  // Stop custom if running
                  if (customPlaying) {
                    customAudioRef.current?.pause()
                    setCustomPlaying(false)
                  }
                  onStartNoise()
                }
              }}
              className={`w-full py-2.5 rounded-xl text-sm font-black transition-all ${
                noiseRunning
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {noiseRunning ? '⏹ إيقاف' : '▶ تشغيل'}
            </button>
            <p className="text-gray-400 text-[9px] mt-2 text-center leading-relaxed">
              {NOISE_DESCRIPTIONS[noiseMode]}
            </p>
          </div>
        </div>
      </ToolbarPopover>

      <div className="w-px h-5 bg-brand-100 flex-shrink-0" />

      {/* Group 3 — Modes */}
      <button
        onClick={onToggleKidMode}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-black text-xs transition-all flex-shrink-0 ${
          kidMode
            ? 'bg-gradient-to-r from-[#7C5CFC] to-[#9A7BFD] text-white shadow-[0_4px_12px_-2px_rgba(124,92,252,0.4)]'
            : 'bg-surface-page text-gray-500 hover:bg-brand-50'
        }`}
        title="وضع الطفل"
      >
        🎮 {kidMode ? 'وضع الأستاذ' : 'وضع الطفل'}
      </button>

      <button
        onClick={onToggleFocusMode}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-black text-xs transition-all flex-shrink-0 ${
          focusMode
            ? 'bg-gradient-to-r from-[#FF8C65] to-[#FFBA44] text-white shadow-[0_4px_12px_-2px_rgba(255,140,101,0.4)]'
            : 'bg-surface-page text-gray-500 hover:bg-brand-50'
        }`}
        title="وضع التركيز"
      >
        🎯 {focusMode ? 'تركيز ●' : 'تركيز'}
      </button>

      <div className="w-px h-5 bg-brand-100 flex-shrink-0" />

      {/* Group 4 — Difficulty */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {([1,2,3] as const).map(d => (
          <button key={d} onClick={() => onSetDifficulty(d)}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
              difficulty === d ? 'bg-brand-600 text-white' : 'bg-surface-page text-gray-400 hover:bg-brand-50'
            }`}>
            {d === 1 ? 'سهل' : d === 2 ? 'متوسط' : 'صعب'}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Report */}
      {hasResults && (
        <button
          onClick={onPrintReport}
          className="flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all bg-surface-page hover:bg-brand-50 text-gray-500 flex-shrink-0"
          title="طباعة تقرير الجلسة"
        >
          📄 تقرير
        </button>
      )}

      {/* Lock session button */}
      <button
        onClick={onLockSession}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-black text-xs transition-all flex-shrink-0 bg-surface-page text-amber-700 hover:bg-amber-50 hover:text-amber-600"
        title="قفل الجلسة — يخفي أدوات المعالج حتى لا يتشتت الطفل"
      >
        🔒 قفل
      </button>
    </div>
    </div>
    </div>
  )
}
