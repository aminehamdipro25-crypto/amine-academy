'use client'
// Toolbar strip below the session header (app/session/[id]/page.tsx): camera,
// whiteboard, prompt cards, student timer, white noise, mode toggles,
// difficulty, report and lock buttons. Extracted out of page.tsx to keep that
// file focused on session state/behavior.
import { Video, PenLine } from 'lucide-react'
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
  calm:  'نغمات هادئة متجانسة بتذبذب يحاكي التنفس البطيء (~6 أنفاس/د) — مستوحى من أبحاث الموسيقى المهدئة للدماغ',
  theta: 'نبضة ثنائية (binaural) بتردد ~6Hz (ثيتا) مرتبطة بالاسترخاء العميق — يلزم استخدام سماعات الرأس',
  focus: 'نبضة ثنائية (binaural) بتردد 40Hz (غاما) مرتبطة باليقظة والتركيز — يلزم استخدام سماعات الرأس',
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
  return (
    /* ── Toolbar strip — wrapped in a grid row that animates 0fr↔1fr so
        show/hide collapses height smoothly instead of an instant display:none
        snap. The 3 toolbar popovers render via a portal to document.body, so
        this wrapper's overflow-hidden never clips them. ── */
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
            {[[60,'1 دقيقة'],[120,'2 دقيقة'],[180,'3 دقائق'],[300,'5 دقائق']].map(([s,l]) => (
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

      {/* White noise / focus music */}
      <div className="relative flex-shrink-0" ref={noiseBtnRef}>
        <button
          onClick={onToggleNoisePanel}
          className={`flex items-center gap-1.5 font-black px-2.5 py-1.5 rounded-lg text-xs transition-all ${
            noiseRunning
              ? 'bg-cyan-600 text-white ring-1 ring-cyan-400/50'
              : 'bg-surface-page hover:bg-brand-50 text-gray-500'
          }`}
          title="موسيقى وترددات الاسترخاء والتركيز"
        >
          🎵 {noiseRunning ? formatTime(noiseSecsLeft) : 'موسيقى'}
        </button>
      </div>
      <ToolbarPopover anchorRef={noiseBtnRef} open={showNoisePanel} onClose={onCloseNoisePanel}>
        <div
          className="rounded-2xl p-3 shadow-2xl bg-white border border-cyan-100"
          style={{ minWidth: 230 }}
          dir="rtl"
        >
          <p className="text-gray-400 text-[10px] font-black mb-2.5 flex items-center gap-1">
            🎵 صوت الجلسة <span className="text-cyan-600">(5 دقائق)</span>
          </p>

          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {NOISE_MODES.map(m => (
              <button
                key={m.key}
                onClick={() => { onSetNoiseMode(m.key); if (noiseRunning) onStopNoise() }}
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

          {/* Countdown */}
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
            onClick={() => noiseRunning ? onStopNoise() : onStartNoise()}
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
