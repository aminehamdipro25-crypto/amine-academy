import ApaSessionPlanner from '@/components/dashboard/ApaSessionPlanner'
import ApaPrintButton from '@/components/dashboard/ApaPrintButton'
import { apaPlanData, apaGroupIndexForAge, type ApaCondition } from '@/lib/apa-plan-data'
import { buildLinkedExerciseMap } from '@/lib/apa-exercise-link'

/**
 * Server component on purpose: the exercise catalogue is ~115KB and must not
 * reach the browser whole. buildLinkedExerciseMap() runs here and hands the
 * planner only the entries its phases actually reference.
 *
 * Reads the hand-off from the specialist toolkit: ?cond=adhd|asd&age=7&name=…
 * so entering a child's data opens the plan already set to their condition and
 * age band instead of asking the specialist to choose it a second time.
 */
export default async function ApaPlannerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const q = await searchParams
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

  const cond: ApaCondition = one(q.cond) === 'asd' ? 'asd' : 'adhd'

  const ageNum = parseInt(one(q.age), 10)
  const hasAge = Number.isFinite(ageNum) && ageNum > 0
  const groupIndex = hasAge ? apaGroupIndexForAge(ageNum) : 0

  const name = one(q.name).trim().slice(0, 60)
  const childLabel = name || hasAge
    ? [name, hasAge ? `${ageNum} سنة` : '', apaPlanData[cond].label].filter(Boolean).join(' · ')
    : undefined

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <ApaPrintButton />
      </div>
      <ApaSessionPlanner
        initialCondition={cond}
        initialGroupIndex={groupIndex}
        childLabel={childLabel}
        childName={name || undefined}
        linkedExercises={buildLinkedExerciseMap()}
      />
    </div>
  )
}
