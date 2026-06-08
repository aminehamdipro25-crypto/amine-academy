'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ExerciseResult } from '@/lib/types'

interface Target { id: number; x: number; y: number; size: number; born: number; emoji: string }

const EMOJIS = ['⭐','🎯','🏀','🌟','💎','🎪','🎨','🦋','🌈','🎭']

interface Props {
  onComplete: (r: ExerciseResult) => void
  onCancel: () => void
  studentAge: number
  difficulty?: 1|2|3
}

export default function TapTarget({ onComplete, onCancel, studentAge, difficulty = 1 }: Props) {
  const duration = 45  // seconds
  const targetLife = difficulty === 1 ? 2500 : difficulty === 2 ? 1800 : 1200
  const spawnRate = difficulty === 1 ? 1800 : difficulty === 2 ? 1200 : 800
  const targetSize = difficulty === 1 ? 80 : difficulty === 2 ? 60 : 50

  const [targets, setTargets] = useState<Target[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [done, setDone] = useState(false)
  const nextId = useRef(0)
  const startRef = useRef(Date.now())
  const areaRef = useRef<HTMLDivElement>(null)

  const spawnTarget = useCallback(() => {
    if (!areaRef.current) return
    const rect = areaRef.current.getBoundingClientRect()
    const margin = targetSize
    const x = margin + Math.random() * (rect.width - margin * 2)
    const y = margin + Math.random() * (rect.height - margin * 2)
    const id = nextId.current++
    setTargets(t => [...t, {
      id, x, y, size: targetSize, born: Date.now(),
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
    }])
    setTimeout(() => {
      setTargets(t => {
        const exists = t.find(tt => tt.id === id)
        if (exists) { setMisses(m => m + 1) }
        return t.filter(tt => tt.id !== id)
      })
    }, targetLife)
  }, [targetSize, targetLife])

  useEffect(() => {
    if (done) return
    const spawn = setInterval(spawnTarget, spawnRate)
    return () => clearInterval(spawn)
  }, [done, spawnTarget, spawnRate])

  useEffect(() => {
    if (done) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          setDone(true)
          const dur = Math.round((Date.now() - startRef.current) / 1000)
          const acc = hits + misses === 0 ? 0 : Math.round((hits / (hits + misses)) * 100)
          onComplete({
            exerciseType: 'tap-target',
            exerciseLabelAr: 'التناسق الحركي — اضغط الهدف',
            score: Math.min(100, hits * (difficulty === 1 ? 5 : difficulty === 2 ? 6 : 7)),
            accuracy: acc,
            duration: dur,
            errors: misses,
            metadata: { hits, misses, difficulty },
            completedAt: new Date().toISOString(),
          })
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [done, hits, misses, difficulty, onComplete])

  function hit(id: number) {
    setTargets(t => t.filter(tt => tt.id !== id))
    setHits(h => h + 1)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="text-center">
          <div className="text-2xl font-black text-green-400">{hits}</div>
          <div className="text-xs text-white/50">إصابات</div>
        </div>
        <div className="text-center">
          <div className={`text-3xl font-black ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
            {timeLeft}ث
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-red-400">{misses}</div>
          <div className="text-xs text-white/50">فائتة</div>
        </div>
      </div>

      <div ref={areaRef} className="relative flex-1 bg-gray-900/50 rounded-2xl mx-4 mb-4 overflow-hidden"
        style={{ minHeight: 400 }}>
        <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-white/20 font-bold select-none pointer-events-none">
          اضغط الأهداف!
        </p>
        {targets.map(t => (
          <button
            key={t.id}
            onClick={() => hit(t.id)}
            className="absolute flex items-center justify-center rounded-full bg-brand-500 hover:bg-brand-400 active:scale-90 transition-all animate-pulse"
            style={{
              left: t.x - t.size / 2,
              top: t.y - t.size / 2,
              width: t.size,
              height: t.size,
              fontSize: t.size * 0.5,
            }}
          >
            {t.emoji}
          </button>
        ))}
      </div>

      <button onClick={onCancel} className="text-white/40 hover:text-white/70 text-sm pb-4 transition-colors text-center">
        ← إنهاء التمرين
      </button>
    </div>
  )
}
