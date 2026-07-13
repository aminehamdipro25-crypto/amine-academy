'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

type BreathMode = '4-7-8' | 'box' | 'belly'
interface Phase { label: string; dur: number; color: string; expand: boolean }

const MODES: Record<BreathMode, { nameAr: string; desc: string; phases: Phase[] }> = {
  '4-7-8': {
    nameAr: 'تنفس 4-7-8',
    desc: 'للاسترخاء والتهدئة',
    phases: [
      { label: 'استنشق',     dur: 4, color: '#2dd4bf', expand: true  },
      { label: 'احبس',       dur: 7, color: '#a78bfa', expand: true  },
      { label: 'أخرج ببطء', dur: 8, color: '#5b6ef2', expand: false },
    ],
  },
  box: {
    nameAr: 'التنفس المربع',
    desc: 'للتركيز والتوازن',
    phases: [
      { label: 'استنشق', dur: 4, color: '#2dd4bf', expand: true  },
      { label: 'احبس',   dur: 4, color: '#a78bfa', expand: true  },
      { label: 'أخرج',   dur: 4, color: '#5b6ef2', expand: false },
      { label: 'احبس',   dur: 4, color: '#fb7185', expand: false },
    ],
  },
  belly: {
    nameAr: 'تنفس البطن',
    desc: 'للمبتدئين والأطفال',
    phases: [
      { label: 'استنشق ببطء', dur: 5, color: '#4ade80', expand: true  },
      { label: 'أخرج ببطء',   dur: 5, color: '#5b6ef2', expand: false },
    ],
  },
}

interface Props { onComplete: (r: ExerciseResult) => void; onCancel: () => void; studentAge: number; difficulty?: 1|2|3 }

export default function BreathingGuide({ onComplete, onCancel, studentAge }: Props) {
  const targetCycles = studentAge < 10 ? 4 : 5

  const [mode, setMode]         = useState<BreathMode | null>(null)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [cycles, setCycles]     = useState(0)
  const [running, setRunning]   = useState(false)
  const [done, setDone]         = useState(false)
  const startRef = useRef(Date.now())
  const doneRef = useRef(false)
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => clearTimeout(completionTimerRef.current ?? undefined), [])

  useEffect(() => {
    if (!running || !mode) return
    const phases = MODES[mode].phases
    const phase  = phases[phaseIdx]
    setCountdown(phase.dur)
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          const nextIdx = (phaseIdx + 1) % phases.length
          if (nextIdx === 0) {
            const nc = cycles + 1
            setCycles(nc)
            if (nc >= targetCycles) {
              const dur = Math.round((Date.now() - startRef.current) / 1000)
              setRunning(false)
              setDone(true)
              if (!doneRef.current) {
                doneRef.current = true
                completionTimerRef.current = setTimeout(() => onComplete({
                  exerciseType: 'breathing',
                  exerciseLabelAr: MODES[mode].nameAr,
                  score: 100, accuracy: 100, duration: dur, errors: 0,
                  metadata: { cycles: nc, mode },
                  completedAt: new Date().toISOString(),
                }), 1200)
              }
              return 0
            }
            setPhaseIdx(0)
          } else {
            setPhaseIdx(nextIdx)
          }
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, mode, phaseIdx, cycles, targetCycles, onComplete])

  function startMode(m: BreathMode) {
    setMode(m)
    setRunning(true)
    setPhaseIdx(0)
    setCycles(0)
    startRef.current = Date.now()
  }

  // Mode selection screen
  if (!mode) return (
    <div className="flex flex-col items-center gap-5 p-6" dir="rtl">
      <div className="text-5xl">🌬️</div>
      <h2 className="text-2xl font-black text-white">تمارين التنفس</h2>
      <p className="text-white/40 text-sm text-center">اختر نوع التنفس المناسب</p>
      <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
        {(Object.keys(MODES) as BreathMode[]).map(m => (
          <button key={m} onClick={() => startMode(m)}
            className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-2xl text-right transition-all active:scale-98">
            <div className="font-black text-white text-lg">{MODES[m].nameAr}</div>
            <div className="text-white/40 text-xs mt-0.5">{MODES[m].desc}</div>
            <div className="text-white/25 text-xs mt-2">
              {MODES[m].phases.map(p => `${p.label} ${p.dur}ث`).join(' · ')}
            </div>
          </button>
        ))}
      </div>
      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-sm transition-colors">← رجوع</button>
    </div>
  )

  // Done screen
  if (done) return (
    <div className="flex flex-col items-center justify-center h-full gap-6" dir="rtl">
      <div className="text-8xl">🌟</div>
      <h2 className="text-white font-black text-3xl">أحسنت!</h2>
      <p className="text-white/60 text-center">أكملت {targetCycles} دورات تنفس</p>
      <div className="bg-white/10 rounded-2xl px-8 py-4 text-center">
        <div className="text-3xl font-black text-teal-400">{targetCycles}</div>
        <div className="text-white/50 text-sm mt-1">دورات مكتملة</div>
      </div>
    </div>
  )

  const currentPhase = MODES[mode].phases[phaseIdx]
  const progress     = cycles / targetCycles

  return (
    <div className="flex flex-col items-center gap-5 p-6 select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center">
          <div className="text-base font-black text-white">{cycles}/{targetCycles}</div>
          <div className="text-[10px] text-white/40">دورات</div>
        </div>
        <h2 className="text-base font-black text-white">{MODES[mode].nameAr}</h2>
        <div className="w-16" />
      </div>

      {/* Overall progress */}
      <div className="w-full max-w-xs bg-white/10 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%`, background: currentPhase.color }} />
      </div>

      {/* Breathing animation — 3 concentric rings */}
      <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
        {/* Outer glow ring */}
        <div className="absolute rounded-full"
          style={{
            width: 260, height: 260,
            backgroundColor: currentPhase.color,
            opacity: 0.12,
            transform: `scale(${running && currentPhase.expand ? 0.95 : 0.60})`,
            transition: `transform ${currentPhase.dur}s ease-in-out`,
          }} />
        {/* Middle ring */}
        <div className="absolute rounded-full"
          style={{
            width: 200, height: 200,
            backgroundColor: currentPhase.color,
            opacity: 0.22,
            transform: `scale(${running && currentPhase.expand ? 1.05 : 0.65})`,
            transition: `transform ${currentPhase.dur}s ease-in-out`,
          }} />
        {/* Core circle */}
        <div className="relative rounded-full flex items-center justify-center"
          style={{
            width: 148, height: 148,
            backgroundColor: currentPhase.color,
            transform: `scale(${running && currentPhase.expand ? 1.18 : 0.80})`,
            transition: `transform ${currentPhase.dur}s ease-in-out`,
            boxShadow: `0 0 55px ${currentPhase.color}88, 0 0 20px ${currentPhase.color}55`,
          }}>
          <div className="text-center">
            <div className="text-white font-black text-5xl leading-none">{countdown}</div>
            <div className="text-white/90 text-sm font-bold mt-1">{currentPhase.label}</div>
          </div>
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex gap-2 flex-wrap justify-center">
        {MODES[mode].phases.map((p, i) => (
          <div key={i}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${i === phaseIdx ? 'text-white' : 'text-white/25'}`}
            style={i === phaseIdx ? { background: p.color } : { background: 'rgba(255,255,255,0.05)' }}>
            {p.label} {p.dur}ث
          </div>
        ))}
      </div>

      <button onClick={onCancel} className="text-white/30 hover:text-white/60 text-sm transition-colors mt-1">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
