'use client'
import type { ExerciseResult } from '@/lib/types'
import { EXERCISES } from '@/lib/session-constants'
import type { ActiveView } from '@/lib/session-constants'

export default function ExerciseConfigModal({
  exerciseConfigId,
  onClose,
  difficulty,
  exerciseDiffOverrides,
  onChangeDiffOverride,
  results,
  gameHistoryByGame,
  gameUsageCounts,
  running,
  onStart,
  onSetActiveView,
}: {
  exerciseConfigId: string | null
  onClose: () => void
  difficulty: 1|2|3
  exerciseDiffOverrides: Partial<Record<string, 1|2|3>>
  onChangeDiffOverride: (id: string, value: 1|2|3 | null) => void
  results: ExerciseResult[]
  gameHistoryByGame: Record<string, { plays: number; avgScore: number }>
  gameUsageCounts: Record<string, number>
  running: boolean
  onStart: () => void
  onSetActiveView: (v: ActiveView) => void
}) {
  if (!exerciseConfigId) return null
  const ex = EXERCISES.find(e => e.id === exerciseConfigId)
  if (!ex) return null

  const overrideDiff = exerciseDiffOverrides[exerciseConfigId] ?? difficulty
  const sessionResults = results.filter(r => r.exerciseType === exerciseConfigId)
  const avgSessionScore = sessionResults.length
    ? Math.round(sessionResults.reduce((s, r) => s + r.score, 0) / sessionResults.length)
    : null

  // Suggest difficulty based on historical performance
  const stats = gameHistoryByGame[exerciseConfigId]
  const suggested: 1|2|3 = stats && stats.plays >= 2
    ? stats.avgScore >= 85 ? Math.min(3, difficulty + 1) as 1|2|3
    : stats.avgScore <= 40 ? Math.max(1, difficulty - 1) as 1|2|3
    : difficulty
    : difficulty

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
      <div
        className="relative rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl bg-white border border-brand-100"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border ${ex.color}`}>
            {ex.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-900 font-black text-sm">{ex.labelAr}</div>
            <div className="text-gray-400 text-xs mt-0.5">{ex.category} • {ex.ageMin}–{ex.ageMax} سنة</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none flex-shrink-0">×</button>
        </div>

        <div className="mb-4">
          <div className="text-gray-400 text-[10px] font-black mb-2 uppercase tracking-wider">الصعوبة لهذا التمرين</div>
          <div className="grid grid-cols-3 gap-2">
            {([1,2,3] as const).map(d => (
              <button
                key={d}
                onClick={() => onChangeDiffOverride(exerciseConfigId, d)}
                className="py-2.5 rounded-xl text-xs font-black transition-all"
                style={{
                  background: overrideDiff === d
                    ? d === 1 ? '#F0FDF4' : d === 2 ? '#FFFBEB' : '#FEF2F2'
                    : '#FFF8F0',
                  color: overrideDiff === d
                    ? d === 1 ? '#16a34a' : d === 2 ? '#d97706' : '#dc2626'
                    : '#9CA3AF',
                  border: overrideDiff === d
                    ? `1px solid ${d === 1 ? '#16a34a55' : d === 2 ? '#d9770655' : '#dc262655'}`
                    : '1px solid transparent',
                }}
              >
                {d === 1 ? '🟢 سهل' : d === 2 ? '🟡 متوسط' : '🔴 صعب'}
              </button>
            ))}
          </div>
          {overrideDiff !== difficulty && (
            <button
              onClick={() => onChangeDiffOverride(exerciseConfigId, null)}
              className="mt-2 text-gray-300 hover:text-gray-500 text-[10px] font-bold transition-colors"
            >
              ← العودة للمستوى العام ({difficulty === 1 ? 'سهل' : difficulty === 2 ? 'متوسط' : 'صعب'})
            </button>
          )}
          {!exerciseDiffOverrides[exerciseConfigId] && suggested !== difficulty && (
            <button
              onClick={() => onChangeDiffOverride(exerciseConfigId, suggested)}
              className="mt-2 w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <span>🤖 مقترح بناءً على متوسط {stats?.avgScore}%: {suggested === 1 ? 'سهل' : suggested === 2 ? 'متوسط' : 'صعب'}</span>
              <span className="text-emerald-600">تطبيق ←</span>
            </button>
          )}
        </div>

        {(sessionResults.length > 0 || (gameUsageCounts[exerciseConfigId] ?? 0) > 0) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {sessionResults.length > 0 && (
              <>
                <div className="bg-surface-page rounded-xl p-3 text-center">
                  <div className="font-black text-xl text-brand-600 ltr-num">{sessionResults.length}</div>
                  <div className="text-gray-400 text-[10px] mt-0.5">مرة الجلسة الحالية</div>
                </div>
                {avgSessionScore !== null && (
                  <div className="bg-surface-page rounded-xl p-3 text-center">
                    <div className={`font-black text-xl ltr-num ${avgSessionScore >= 80 ? 'text-emerald-600' : avgSessionScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {avgSessionScore}%
                    </div>
                    <div className="text-gray-400 text-[10px] mt-0.5">متوسط الدرجات</div>
                  </div>
                )}
              </>
            )}
            {(gameUsageCounts[exerciseConfigId] ?? 0) > 0 && sessionResults.length === 0 && (
              <div className="col-span-2 bg-surface-page rounded-xl p-3 flex items-center justify-between">
                <span className="text-gray-400 text-xs">الجلسات السابقة</span>
                <span className="text-brand-600 font-black text-sm ltr-num">{gameUsageCounts[exerciseConfigId]} مرة</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => {
            if (!running) onStart()
            onSetActiveView({ type: 'exercise', id: exerciseConfigId })
            onClose()
          }}
          className="w-full py-3 rounded-xl font-black text-sm text-white transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', boxShadow: '0 4px 20px rgba(124,92,252,0.35)' }}
        >
          {ex.icon} تشغيل التمرين الآن →
        </button>
      </div>
    </div>
  )
}
