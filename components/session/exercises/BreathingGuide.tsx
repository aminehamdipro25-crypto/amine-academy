'use client'
import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult } from '@/lib/types'

type BreathMode = '4-7-8' | 'box' | 'belly'

interface Phase { label: string; dur: number; scale: number; color: string }

const MODES: Record<BreathMode, { nameAr: string; phases: Phase[] }> = {
  '4-7-8': {
    nameAr: 'تنفس 4-7-8',
    phases: [
      { label: 'استنشق', dur: 4, scale: 1.6, color: '#2dd4bf' },
      { label: 'احبس', dur: 7, scale: 1.6, color: '#a78bfa' },
      { label: 'أخرج', dur: 8, scale: 1.0, color: '#5b6ef2' },
    ],
  },
  box: {
    nameAr: 'التنفس المربع',
    phases: [
      { label: 'استنشق', dur: 4, scale: 1.6, color: '#2dd4bf' },
      { label: 'احبس', dur: 4, scale: 1.6, color: '#a78bfa' },
      { label: 'أخرج', dur: 4, scale: 1.0, color: '#5b6ef2' },
      { label: 'احبس', dur: 4, scale: 1.0, color: '#fb7185' },
    ],
  },
  belly: {
    nameAr: 'تنفس البطن',
    phases: [
      { label: 'استنشق ببطء', dur: 5, scale: 1.7, color: '#4ade80' },
      { label: 'أخرج ببطء', dur: 5, scale: 1.0, color: '#5b6ef2' },
    ],
  },
}

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function BreathingGuide({ onComplete, onCancel, studentAge }: Props) {
  const targetCycles = 5
  const [mode, setMode] = useState<BreathMode | null>(null)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [running, setRunning] = useState(false)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (!running || !mode) return
    const phases = MODES[mode].phases
    const phase = phases[phaseIdx]
    setCountdown(phase.dur)
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          const nextIdx = (phaseIdx + 1) % phases.length
          if (nextIdx === 0) {
            const newCycles = cycles + 1
            setCycles(newCycles)
            if (newCycles >= targetCycles) {
              const dur = Math.round((Date.now() - startRef.current) / 1000)
              setRunning(false)
              onComplete({
                exerciseType: 'breathing',
                exerciseLabelAr: MODES[mode].nameAr,
                score: 100,
                accuracy: 100,
                duration: dur,
                errors: 0,
                metadata: { cycles: newCycles, mode },
                completedAt: new Date().toISOString(),
              })
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

  if (!mode) {
    return (
      <div className="flex flex-col items-center gap-6 p-6">
        <h2 className="text-2xl font-black text-white">تمارين التنفس</h2>
        <p className="text-white/60 text-sm text-center">اختر نوع التنفس المناسب</p>
        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
          {(Object.keys(MODES) as BreathMode[]).map(m => (
            <button key={m} onClick={() => startMode(m)}
              className="p-5 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-2xl text-right transition-all">
              <div className="font-black text-white text-lg mb-1">{MODES[m].nameAr}</div>
              <div className="text-white/50 text-sm">
                {MODES[m].phases.map(p => `${p.label} ${p.dur}ث`).join(' · ')}
              </div>
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          ← رجوع
        </button>
      </div>
    )
  }

  const currentPhase = MODES[mode].phases[phaseIdx]

  return (
    <div className="flex flex-col items-center gap-8 p-6 select-none">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-2xl font-black text-brand-400">{cycles}/{targetCycles}</div>
          <div className="text-xs text-white/50">دورات</div>
        </div>
        <h2 className="text-lg font-black text-white">{MODES[mode].nameAr}</h2>
        <div className="w-16" />
      </div>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        {/* Outer ripple */}
        <div
          className="absolute rounded-full opacity-20"
          style={{
            width: 240, height: 240,
            backgroundColor: currentPhase.color,
            transform: `scale(${running ? currentPhase.scale * 0.85 : 1})`,
            transition: `transform ${currentPhase.dur}s ease-in-out`,
          }}
        />
        {/* Main circle */}
        <div
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: 160, height: 160,
            backgroundColor: currentPhase.color,
            transform: `scale(${running ? currentPhase.scale * 0.7 : 1})`,
            transition: `transform ${currentPhase.dur}s ease-in-out`,
            boxShadow: `0 0 40px ${currentPhase.color}88`,
          }}
        >
          <div className="text-center">
            <div className="text-white font-black text-4xl ltr-num">{countdown}</div>
            <div className="text-white/80 text-sm font-bold">{currentPhase.label}</div>
          </div>
        </div>
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm transition-colors">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
