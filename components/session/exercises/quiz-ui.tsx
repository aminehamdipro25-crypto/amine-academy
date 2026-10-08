'use client'
// Shared visual kit for the "choice-style" exercises (ConversationStarter,
// IfThen, AnalogiesGame, EmotionMirror, MathFlash …). Keeps the prompt card,
// the answer buttons and the progress bar looking like one polished game
// instead of a plain HTML form — without touching each game's own logic.
import type { CSSProperties, ReactNode } from 'react'

export function QuizProgress({ value }: { value: number }) {
  return (
    <div className="w-full max-w-md h-1.5 rounded-full overflow-hidden bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: 'linear-gradient(90deg,#8B5CF6,#22D3EE)' }}
      />
    </div>
  )
}

export function PromptCard({ emoji, accent = '#7C5CFC', children }: { emoji?: ReactNode; accent?: string; children: ReactNode }) {
  return (
    <div
      className="w-full max-w-md rounded-3xl p-5 text-center relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${accent}2E, ${accent}12)`,
        border: `1px solid ${accent}55`,
        boxShadow: `0 10px 30px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.12)`,
      }}
    >
      {emoji != null && (
        <div
          className="mx-auto mb-3 w-20 h-20 rounded-full flex items-center justify-center text-5xl"
          style={{ background: `radial-gradient(circle at 40% 35%, ${accent}66, ${accent}1A)`, boxShadow: `0 0 26px ${accent}44` }}
        >
          {emoji}
        </div>
      )}
      {children}
    </div>
  )
}

export type ChoiceState = 'idle' | 'correct' | 'wrong' | 'reveal'

// Depth + colour feedback for an answer button. `reveal` marks the correct
// answer after the child picked a wrong one.
export function choiceStyle(state: ChoiceState): CSSProperties {
  switch (state) {
    case 'correct': return { background: 'linear-gradient(145deg,rgba(34,197,94,0.38),rgba(22,163,74,0.22))', borderColor: '#4ADE80', boxShadow: '0 0 22px rgba(34,197,94,0.45)' }
    case 'wrong':   return { background: 'linear-gradient(145deg,rgba(239,68,68,0.38),rgba(220,38,38,0.22))', borderColor: '#F87171', boxShadow: '0 0 18px rgba(239,68,68,0.40)' }
    case 'reveal':  return { background: 'linear-gradient(145deg,rgba(34,197,94,0.18),rgba(22,163,74,0.10))', borderColor: 'rgba(74,222,128,0.45)' }
    default:        return { background: 'linear-gradient(145deg,rgba(255,255,255,0.10),rgba(255,255,255,0.035))', borderColor: 'rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.20)' }
  }
}

// Base classes for a choice button; pass the entrance index for a stagger.
export const CHOICE_CLASS =
  'w-full py-3.5 px-4 rounded-2xl text-sm font-bold text-right text-white border-2 transition-all duration-200 ' +
  'enabled:hover:brightness-110 enabled:active:scale-[.97] disabled:cursor-not-allowed quiz-choice-in'

export function staggerDelay(i: number): CSSProperties {
  return { animationDelay: `${Math.min(i * 60, 320)}ms` }
}
