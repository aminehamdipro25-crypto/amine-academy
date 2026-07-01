'use client'
import { useMemo } from 'react'
import type { ExerciseResult } from '@/lib/types'
import { computeSessionMomentum, computeBestExercise, computeSessionStars } from '@/lib/session-adaptive'
import { formatTime } from '@/lib/session-helpers'

export default function LiveSessionCard({
  results,
  elapsed,
  gameHistoryByGame,
}: {
  results: ExerciseResult[]
  elapsed: number
  gameHistoryByGame: Record<string, { plays: number; avgScore: number }>
}) {
  const momentum  = useMemo(() => computeSessionMomentum(results, elapsed), [results, elapsed])
  const best      = useMemo(() => computeBestExercise(results), [results])
  const stars     = useMemo(() => computeSessionStars(results), [results])
  const totalAvg  = momentum.totalAvg
  const exCount   = results.length

  if (results.length === 0) return null

  // Historical comparison
  const histAvgs = results
    .map(r => gameHistoryByGame[r.exerciseType]?.avgScore)
    .filter((v): v is number => v != null && !isNaN(v))
  const histAvg   = histAvgs.length > 0 ? Math.round(histAvgs.reduce((s, v) => s + v, 0) / histAvgs.length) : null
  const vsHist    = histAvg !== null ? totalAvg - histAvg : null

  const trendIcon  = momentum.trend === 'rising' ? '📈' : momentum.trend === 'falling' ? '📉' : '➡️'
  const trendColor = momentum.trend === 'rising' ? '#22C55E' : momentum.trend === 'falling' ? '#EF4444' : '#9CA3AF'
  const trendLabel = momentum.trend === 'rising' ? 'يتحسّن' : momentum.trend === 'falling' ? 'يتراجع' : 'مستقر'

  const scoreColor = totalAvg >= 80 ? '#22C55E' : totalAvg >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div
      className="rounded-2xl p-3 space-y-2.5"
      style={{
        background: 'rgba(17,24,39,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
      }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-white/50 font-black text-[10px] uppercase tracking-widest">📊 ذكاء الجلسة</span>
        <span className="text-white/30 text-[10px] ltr-num">{formatTime(elapsed)}</span>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-xl p-2 text-center">
          <div className="font-black text-lg ltr-num" style={{ color: scoreColor }}>{totalAvg}%</div>
          <div className="text-white/40 text-[9px] mt-0.5">متوسط الدرجات</div>
        </div>
        <div className="bg-white/5 rounded-xl p-2 text-center">
          <div className="font-black text-lg text-white ltr-num">{exCount}</div>
          <div className="text-white/40 text-[9px] mt-0.5">تمارين</div>
        </div>
        <div className="bg-white/5 rounded-xl p-2 text-center">
          <div className="font-black text-lg text-amber-400 ltr-num">{'⭐'.repeat(Math.min(stars, 5))}{stars > 5 ? `+${stars-5}` : ''}</div>
          <div className="text-white/40 text-[9px] mt-0.5">{stars} نجمة</div>
        </div>
      </div>

      {/* Trend + fatigue */}
      <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
        <span className="text-white/60 text-[10px] font-bold">الأداء</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{trendIcon}</span>
          <span className="font-black text-[11px]" style={{ color: trendColor }}>{trendLabel}</span>
          {results.length >= 2 && (
            <span className="text-white/30 text-[9px] ltr-num">
              ({momentum.earlyAvg}% → {momentum.recentAvg}%)
            </span>
          )}
        </div>
      </div>

      {/* Fatigue warning */}
      {momentum.fatigueWarning && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <span className="text-sm">😴</span>
          <span className="text-red-400 font-black text-[10px]">تراجع في الأداء — الطفل قد يكون متعباً</span>
        </div>
      )}

      {/* Best exercise */}
      {best && (
        <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
          <span className="text-white/60 text-[10px] font-bold">الأفضل اليوم</span>
          <div className="text-right">
            <span className="text-white font-black text-[10px]">{best.label}</span>
            <span className="text-green-400 font-black text-[10px] mr-1.5 ltr-num">{best.avgScore}%</span>
          </div>
        </div>
      )}

      {/* vs historical */}
      {vsHist !== null && histAvg !== null && (
        <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
          <span className="text-white/60 text-[10px] font-bold">مقارنة بالسابق</span>
          <span
            className="font-black text-[11px] ltr-num"
            style={{ color: vsHist > 0 ? '#22C55E' : vsHist < 0 ? '#EF4444' : '#9CA3AF' }}
          >
            {vsHist > 0 ? '+' : ''}{vsHist}% {vsHist > 5 ? '🔥' : vsHist < -5 ? '⚠️' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
