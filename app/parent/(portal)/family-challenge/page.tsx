'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Users, Sparkles, RotateCcw } from 'lucide-react'
import type { ExerciseResult } from '@/lib/types'

const ReactionGame = dynamic(() => import('@/components/session/exercises/ReactionGame'), { ssr: false })

type Stage = 'intro' | 'parent-turn' | 'child-turn' | 'result'

export default function FamilyChallengePage() {
  const [childName, setChildName] = useState('طفلك')
  const [stage, setStage] = useState<Stage>('intro')
  const [parentResult, setParentResult] = useState<ExerciseResult | null>(null)
  const [childResult, setChildResult] = useState<ExerciseResult | null>(null)

  useEffect(() => {
    fetch('/api/parent/game-progress')
      .then(r => r.json())
      .then(d => { const first = d?.progressData?.[0]?.student; if (first?.firstName) setChildName(first.firstName) })
      .catch(() => {})
  }, [])

  function reset() {
    setParentResult(null)
    setChildResult(null)
    setStage('intro')
  }

  const parentMs = parentResult?.metadata.avgReactionMs as number | undefined
  const childMs = childResult?.metadata.avgReactionMs as number | undefined
  const winner = parentMs != null && childMs != null
    ? (parentMs < childMs ? 'parent' : childMs < parentMs ? 'child' : 'tie')
    : null

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" style={{ color: '#7C5CFC' }} /> تحدي العائلة
        </h1>
        <p className="text-gray-400 text-sm mt-1">لعبة سريعة وممتعة تلعبونها معًا على نفس الجهاز</p>
      </div>

      {stage === 'intro' && (
        <div className="rounded-2xl p-6 text-center" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
          <div className="text-5xl mb-3">⚡👨‍👩‍👧</div>
          <h2 className="font-black text-gray-900 text-base mb-2">من الأسرع: أنت أم {childName}؟</h2>
          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            كل واحد يلعب لعبة رد الفعل بدوره على هذا الجهاز، ثم نقارن النتيجتين بطريقة مرحة.
            <br />لا حاجة لأي تسجيل — فقط استمتعوا بوقتكم معًا!
          </p>
          <button
            onClick={() => setStage('parent-turn')}
            className="bg-brand-600 hover:bg-brand-700 text-white font-black px-8 py-3 rounded-xl transition-colors"
          >
            ابدأ التحدي 🚀
          </button>
        </div>
      )}

      {(stage === 'parent-turn' || stage === 'child-turn') && (
        <div
          className="rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #1e1b4b, #0f172a)', height: '70vh', minHeight: 480 }}
        >
          <div className="flex flex-col h-full">
            <div className="px-5 pt-5 pb-2 text-center flex-shrink-0">
              <span className="inline-block bg-white/10 text-white font-black text-xs px-4 py-1.5 rounded-full">
                {stage === 'parent-turn' ? '🧑 دور الوالد/الوالدة' : `🧒 دور ${childName}`}
              </span>
            </div>
            <div className="flex-1">
              <ReactionGame
                studentAge={10}
                difficulty={2}
                onCancel={() => setStage('intro')}
                onComplete={(r) => {
                  if (stage === 'parent-turn') { setParentResult(r); setStage('child-turn') }
                  else { setChildResult(r); setStage('result') }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {stage === 'result' && parentResult && childResult && (
        <div className="rounded-2xl p-6 text-center" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
          <div className="text-5xl mb-3">
            {winner === 'tie' ? '🤝' : '🎉'}
          </div>
          <h2 className="font-black text-gray-900 text-base mb-1">
            {winner === 'tie' ? 'تعادل رائع!' : winner === 'parent' ? 'فاز الوالد/الوالدة! 🏆' : `فاز ${childName}! 🏆`}
          </h2>
          <p className="text-gray-400 text-xs mb-5">الأهم أنكما لعبتما معًا 💜</p>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl p-4" style={{ background: winner === 'parent' ? '#F0FDF4' : '#F9FAFB', border: winner === 'parent' ? '1.5px solid #A7F3D0' : '1px solid #F3F4F6' }}>
              <div className="text-2xl font-black text-gray-900 ltr-num">{Math.round(parentMs ?? 0)}ms</div>
              <div className="text-xs text-gray-500 mt-1">الوالد/الوالدة</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: winner === 'child' ? '#F0FDF4' : '#F9FAFB', border: winner === 'child' ? '1.5px solid #A7F3D0' : '1px solid #F3F4F6' }}>
              <div className="text-2xl font-black text-gray-900 ltr-num">{Math.round(childMs ?? 0)}ms</div>
              <div className="text-xs text-gray-500 mt-1">{childName}</div>
            </div>
          </div>

          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-black px-6 py-2.5 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> تحدي آخر
          </button>
        </div>
      )}

      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: '#D97706' }} />
        <p className="text-amber-800 text-xs leading-relaxed">
          هذا التحدي للمتعة فقط ولا يُسجَّل في تقارير الطفل — فقط لحظة مرحة تجمعكما.
        </p>
      </div>
    </div>
  )
}
