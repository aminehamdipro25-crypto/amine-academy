'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Printer } from 'lucide-react'
import ApaSessionPlanner from '@/components/dashboard/ApaSessionPlanner'
import { apaPlanData, apaGroupIndexForAge, type ApaCondition } from '@/lib/apa-plan-data'

/**
 * Reads the hand-off from the specialist toolkit: ?cond=adhd|asd&age=7&name=…
 * so entering a child's data opens the plan already set to their condition and
 * age band instead of asking the specialist to choose it a second time.
 */
function PlannerFromQuery() {
  const q = useSearchParams()

  const condParam = q.get('cond')
  const cond: ApaCondition = condParam === 'asd' ? 'asd' : 'adhd'

  const ageNum = parseInt(q.get('age') ?? '', 10)
  const hasAge = Number.isFinite(ageNum) && ageNum > 0
  const groupIndex = hasAge ? apaGroupIndexForAge(ageNum) : 0

  const name = (q.get('name') ?? '').trim().slice(0, 60)
  const childLabel = name || hasAge
    ? [name, hasAge ? `${ageNum} سنة` : '', apaPlanData[cond].label].filter(Boolean).join(' · ')
    : undefined

  return (
    <ApaSessionPlanner
      initialCondition={cond}
      initialGroupIndex={groupIndex}
      childLabel={childLabel}
    />
  )
}

export default function ApaPlannerPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-gray-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm"
        >
          <Printer className="w-4 h-4" />
          طباعة خطة الحصة
        </button>
      </div>
      <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-gray-300" /></div>}>
        <PlannerFromQuery />
      </Suspense>
    </div>
  )
}
