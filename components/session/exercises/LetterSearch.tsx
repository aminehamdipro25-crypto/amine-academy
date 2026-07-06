'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { speakArabic, cancelSpeech } from '@/lib/speech'

// ── Clinically-relevant Arabic confusion pairs ──────────────────────────────
// Letters that children with dyslexia / visual-processing difficulties confuse
const CONFUSION_GROUPS: string[][] = [
  ['ب', 'ت', 'ث', 'ن'],   // dot count / position
  ['ج', 'ح', 'خ'],          // open-body shape
  ['س', 'ش', 'ص', 'ض'],   // serrated / curved base
  ['ع', 'غ'],                // open-eye shape
  ['ر', 'ز', 'ذ'],          // descender shape
  ['ف', 'ق'],                // one vs two dots
]

const ALL_LETTERS = CONFUSION_GROUPS.flat()   // 18 distinct Arabic letters
const COLS = 5
const ROWS = 6
const TOTAL = COLS * ROWS  // 30 cells

interface DiffConfig {
  rounds:    number
  targets:   number          // target-letter instances per round
  timeLimit: number | null   // null = no timer
}

const CONFIGS: Record<1|2|3, DiffConfig> = {
  1: { rounds: 8,  targets: 3, timeLimit: null },
  2: { rounds: 12, targets: 5, timeLimit: 20   },
  3: { rounds: 16, targets: 7, timeLimit: 12   },
}

interface Cell { letter: string; target: boolean }
type Phase = 'intro' | 'playing' | 'between' | 'done'

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel:   () => void
  studentAge: number
  difficulty?: 1|2|3
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildGrid(targetCount: number): { cells: Cell[]; target: string } {
  const group  = CONFUSION_GROUPS[Math.floor(Math.random() * CONFUSION_GROUPS.length)]
  const target = group[Math.floor(Math.random() * group.length)]
  const sibs   = group.filter(l => l !== target)
  const others = ALL_LETTERS.filter(l => l !== target)

  const cells: Cell[] = []
  for (let i = 0; i < targetCount; i++) cells.push({ letter: target, target: true })

  // Fill remaining cells: ~40% same-group distractors (clinically harder), rest random pool
  while (cells.length < TOTAL) {
    const letter =
      sibs.length > 0 && Math.random() < 0.40
        ? sibs[Math.floor(Math.random() * sibs.length)]
        : others[Math.floor(Math.random() * others.length)]
    cells.push({ letter, target: false })
  }
  return { cells: shuffle(cells), target }
}

// ── Embedded keyframe animations ────────────────────────────────────────────
const ANIMATIONS = `
  @keyframes ls-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-7px); }
    40%     { transform: translateX( 7px); }
    60%     { transform: translateX(-5px); }
    80%     { transform: translateX( 5px); }
  }
  .ls-shake { animation: ls-shake 0.42s ease; }

  @keyframes ls-pop {
    0%   { transform: scale(1); }
    45%  { transform: scale(1.28); }
    70%  { transform: scale(0.92); }
    100% { transform: scale(1); }
  }
  .ls-pop { animation: ls-pop 0.4s ease; }

  @keyframes ls-found {
    0%   { transform: scale(1);   opacity: 1; }
    40%  { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(0);   opacity: 0; }
  }
  .ls-found { animation: ls-found 0.35s ease forwards; }
`

const BG = 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%)'

// ── Component ────────────────────────────────────────────────────────────────

export default function LetterSearch({ onComplete, onCancel, difficulty = 1 }: Props) {
  const cfg = CONFIGS[difficulty]

  const [phase,    setPhase]    = useState<Phase>('intro')
  const [round,    setRound]    = useState(0)
  const [cells,    setCells]    = useState<Cell[]>([])
  const [target,   setTarget]   = useState('')
  const [found,    setFound]    = useState<Set<number>>(new Set())
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [rErr,     setRErr]     = useState(0)      // errors this round
  const [cleared,  setCleared]  = useState(false)  // all targets found?
  const [totFound, setTotFound] = useState(0)
  const [totErr,   setTotErr]   = useState(0)

  const startRef   = useRef(Date.now())
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roundDone  = useRef(false)   // guard against double-fire per round
  const gameDone   = useRef(false)   // guard against double onComplete

  // Cleanup on unmount
  useEffect(() => () => {
    if (timerRef.current)   clearTimeout(timerRef.current)
    if (shakeTimer.current) clearTimeout(shakeTimer.current)
    cancelSpeech()
  }, [])

  // ── finish game ────────────────────────────────────────────────────────────
  const finish = useCallback((tf: number, te: number) => {
    if (gameDone.current) return
    gameDone.current = true
    const dur      = Math.round((Date.now() - startRef.current) / 1000)
    const possible = cfg.rounds * cfg.targets
    const acc      = Math.round(Math.min(100, (tf / Math.max(1, possible)) * 100))
    const score    = Math.max(0, Math.min(100, acc - te * 2))
    setPhase('done')
    onComplete({
      exerciseType:    'letter-search',
      exerciseLabelAr: 'ابحث عن الحرف — التمييز البصري للحروف العربية',
      score,
      accuracy:  acc,
      duration:  dur,
      errors:    te,
      metadata: {
        difficulty,
        rounds:   cfg.rounds,
        targets:  cfg.targets,
        found:    tf,
        possible,
        gridSize: `${COLS}×${ROWS}`,
      },
      completedAt: new Date().toISOString(),
    })
  }, [cfg.rounds, cfg.targets, difficulty, onComplete])

  // ── advance to next round (or end game) ───────────────────────────────────
  const advance = useCallback((foundNow: number, errNow: number) => {
    if (roundDone.current) return
    roundDone.current = true

    const tf = totFound + foundNow
    const te = totErr   + errNow
    setTotFound(tf)
    setTotErr(te)
    setCleared(foundNow >= cfg.targets)
    setPhase('between')

    timerRef.current = setTimeout(() => {
      const nr = round + 1
      if (nr >= cfg.rounds) {
        finish(tf, te)
        return
      }
      // Inline next-round setup to avoid stale-closure from startRound dep
      const { cells: nc, target: nt } = buildGrid(cfg.targets)
      setCells(nc)
      setTarget(nt)
      setFound(new Set())
      setShakeIdx(null)
      setRErr(0)
      setTimeLeft(cfg.timeLimit ?? 0)
      setRound(nr)
      setCleared(false)
      roundDone.current = false
      setPhase('playing')
    }, 1500)
  }, [round, totFound, totErr, cfg.rounds, cfg.targets, cfg.timeLimit, finish])

  // ── countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || cfg.timeLimit === null) return
    if (timeLeft <= 0) { advance(found.size, rErr); return }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft, cfg.timeLimit, found.size, rErr, advance])

  // ── tap a cell ────────────────────────────────────────────────────────────
  const tap = useCallback((idx: number) => {
    if (phase !== 'playing' || found.has(idx)) return
    const c = cells[idx]
    if (!c) return

    if (c.target) {
      const nf = new Set(found)
      nf.add(idx)
      setFound(nf)
      if (nf.size >= cfg.targets) advance(nf.size, rErr)
    } else {
      setRErr(e => e + 1)
      setShakeIdx(idx)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => setShakeIdx(null), 500)
    }
  }, [phase, cells, found, rErr, cfg.targets, advance])

  // ── start game ────────────────────────────────────────────────────────────
  function startGame() {
    const { cells: nc, target: nt } = buildGrid(cfg.targets)
    startRef.current = Date.now()
    setCells(nc); setTarget(nt)
    setFound(new Set()); setRErr(0)
    setTimeLeft(cfg.timeLimit ?? 0)
    setRound(0); setCleared(false)
    setTotFound(0); setTotErr(0)
    roundDone.current = false
    gameDone.current  = false
    setPhase('playing')
  }

  // Announce target letter via TTS whenever a new round starts
  useEffect(() => {
    if (phase === 'playing' && target) {
      const t = setTimeout(() => speakArabic(target, 0.7), 300)
      return () => clearTimeout(t)
    }
  }, [target, phase]) // eslint-disable-line

  // ── early exits ───────────────────────────────────────────────────────────
  if (phase === 'done') return (
    <div dir="rtl" className="flex flex-col items-center justify-center h-full gap-4 p-8" style={{ background: BG }}>
      <div className="text-6xl ls-pop">✅</div>
      <h2 className="text-2xl font-black text-purple-900">انتهى التمرين!</h2>
      <p className="text-purple-600 text-center">جاري حفظ النتائج…</p>
    </div>
  )

  const pct = Math.round((round / cfg.rounds) * 100)

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div
        dir="rtl"
        className="flex flex-col items-center justify-center gap-6 px-6 min-h-full"
        style={{ background: BG }}
      >
        <style>{ANIMATIONS}</style>

        <div className="text-7xl ls-pop">🔠</div>

        <h2 className="text-2xl font-black text-purple-900 text-center">
          ابحث عن الحرف
        </h2>

        <div className="bg-white/80 border border-purple-100 rounded-2xl p-5 w-full max-w-xs shadow-md space-y-3 text-center">
          <p className="text-purple-900 font-bold">
            ابحث عن الحرف المحدد داخل شبكة الحروف
          </p>
          <p className="text-purple-600 text-sm leading-relaxed">
            اضغط على كل الحروف المطابقة للحرف الهدف في أعلى الشاشة — انتبه للحروف المتشابهة!
          </p>

          {/* Example confusion pair visual */}
          <div className="flex items-center justify-center gap-1 pt-1">
            {['ب', 'ت', 'ث', 'ن'].map((l, i) => (
              <div
                key={l}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg font-black border-2
                  ${i === 0
                    ? 'border-purple-500 bg-purple-100 text-purple-800'
                    : 'border-purple-200 bg-white text-purple-400'}`}
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                {l}
              </div>
            ))}
          </div>
          <p className="text-purple-400 text-xs">مثال: ابحث عن ب بين الحروف المتشابهة</p>

          <div className="border-t border-purple-100 pt-2 flex justify-center gap-5 text-sm">
            <span className="font-bold text-purple-800">{cfg.rounds} جولات</span>
            <span className="text-purple-400">
              {cfg.timeLimit ? `${cfg.timeLimit} ث / جولة` : 'بلا توقيت'}
            </span>
          </div>
        </div>

        <button
          onClick={startGame}
          className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black px-10 py-4 rounded-2xl text-lg transition-all shadow-lg shadow-purple-200"
        >
          ابدأ التمرين
        </button>

        <button
          onClick={onCancel}
          className="text-purple-400 hover:text-purple-600 text-sm transition-colors"
        >
          ← إلغاء
        </button>
      </div>
    )
  }

  // ── Playing / Between-round screen ────────────────────────────────────────
  return (
    <div
      dir="rtl"
      className="flex flex-col h-full select-none"
      style={{ background: BG }}
    >
      <style>{ANIMATIONS}</style>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-purple-500">
            جولة {round + 1} / {cfg.rounds}
          </span>
          {cfg.timeLimit !== null && (
            <span
              className={`text-sm font-black tabular-nums transition-colors ${
                timeLeft <= 5 ? 'text-red-500' : 'text-purple-600'
              }`}
            >
              ⏱ {timeLeft} ث
            </span>
          )}
          <span className="text-xs text-purple-400">{pct}٪</span>
        </div>
        <div className="w-full bg-purple-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-purple-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Target card + found counter ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-2 pb-1">
        {/* Target */}
        <div className="flex items-center gap-2">
          <span className="text-purple-500 font-semibold text-sm">ابحث عن:</span>
          <div
            className={`flex items-center justify-center rounded-2xl font-black shadow-md
              transition-all duration-300 text-white
              ${phase === 'between' && cleared
                ? 'bg-green-500 shadow-green-200 scale-110'
                : 'bg-purple-600 shadow-purple-200'
              }`}
            style={{
              width: 60, height: 60,
              fontSize: '2.1rem',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {target}
          </div>
          {phase === 'between' && (
            <span className="text-3xl ls-pop">
              {cleared ? '🎉' : '⏰'}
            </span>
          )}
        </div>

        {/* Found counter */}
        <div className="bg-white/70 border border-purple-100 rounded-xl px-4 py-2 text-center shadow-sm">
          <div className="text-base font-black text-green-600 leading-tight">
            {found.size} / {cfg.targets}
          </div>
          <div className="text-xs text-purple-400">وجدت</div>
        </div>
      </div>

      {/* ── Between-round feedback banner ─────────────────────────────────── */}
      {phase === 'between' && (
        <div
          className={`mx-4 mb-2 py-2.5 px-4 rounded-xl text-center font-bold text-sm border shadow-sm
            ${cleared
              ? 'bg-green-50 text-green-800 border-green-300'
              : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
        >
          {cleared
            ? `🌟 رائع! وجدت جميع الحروف الـ${cfg.targets}`
            : `وجدت ${found.size} من ${cfg.targets} — فاتك ${cfg.targets - found.size}`}
          {rErr > 0 && (
            <span className="text-red-400 font-medium mr-2">
              {' '}• {rErr} {rErr === 1 ? 'خطأ' : 'أخطاء'}
            </span>
          )}
        </div>
      )}

      {/* ── Letter grid ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-2 pb-1">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {cells.map((cell, idx) => {
            const isFound   = found.has(idx)
            const isShaking = shakeIdx === idx
            const isPlaying = phase === 'playing'

            return (
              <button
                key={idx}
                onClick={() => tap(idx)}
                disabled={isFound || !isPlaying}
                className={[
                  'flex items-center justify-center rounded-xl border-2 font-black',
                  'transition-colors duration-150',
                  isFound
                    ? 'ls-found border-green-400 bg-green-100 text-green-600 pointer-events-none'
                    : isShaking
                      ? 'ls-shake border-red-400 bg-red-100 text-red-600'
                      : !isPlaying
                        ? 'border-purple-100 bg-white/40 text-purple-300 pointer-events-none'
                        : 'border-purple-200 bg-white/90 text-purple-900 hover:border-purple-400 hover:bg-purple-50 active:scale-90 shadow-sm cursor-pointer',
                ].join(' ')}
                style={{
                  width: 62, height: 62,
                  fontSize: '1.6rem',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {isFound ? '✓' : cell.letter}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Cancel button ─────────────────────────────────────────────────── */}
      <button
        onClick={onCancel}
        className="text-purple-400 hover:text-purple-600 text-sm py-3 text-center transition-colors"
      >
        ← إنهاء التمرين
      </button>
    </div>
  )
}
