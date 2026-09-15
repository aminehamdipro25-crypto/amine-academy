// Behavioural activation — activity scheduling and mood tracking.
//
// SCOPE, STATED PLAINLY: low mood in a child is treated by a qualified mental
// health professional. Nothing here treats depression, and nothing in this
// platform should ever be presented as doing so.
//
// What this IS: behavioural activation is the mechanism with the best evidence
// that is also squarely inside an adapted-physical-activity specialist's scope —
// scheduling pleasant, mostly movement-based activities and observing what they
// do to mood. Two things make it worth building here rather than leaving the
// internalising subscale with nothing attached:
//
//   1. It measures rather than claims. The child rates mood before and after,
//      so the specialist learns whether activity lifts THIS child and which
//      activities do it — a real, reportable observation.
//   2. It is a support alongside referral, never instead of it. A child whose
//      PSC-17 internalising subscale is over its cut-off still needs a
//      psychologist; this gives the family something to do in the meantime that
//      is known to help and cannot hurt.
//
// The exercise deliberately does NOT reward "feeling better". A child whose
// mood does not lift has not failed, and telling them otherwise would teach
// them to hide it.

/** The child's own rating, 1 (very low) to 5 (very good). */
export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface MoodFace {
  level: MoodLevel
  emoji: string
  label: string
  color: string
}

export const MOOD_FACES: MoodFace[] = [
  { level: 1, emoji: '😢', label: 'سيّئ جداً', color: '#DC2626' },
  { level: 2, emoji: '🙁', label: 'سيّئ', color: '#EA580C' },
  { level: 3, emoji: '😐', label: 'عادي', color: '#D97706' },
  { level: 4, emoji: '🙂', label: 'جيد', color: '#059669' },
  { level: 5, emoji: '😄', label: 'جيد جداً', color: '#047857' },
]

export interface PleasantActivity {
  id: string
  label: string
  emoji: string
  /** Minutes the guided timer runs. Kept short: the point is to start, not to endure. */
  minutes: number
  ageMin: number
  /** Movement-led activities come first — they are this specialist's own lane. */
  movement: boolean
}

/**
 * A short menu, on purpose. Behavioural activation fails when the choice is
 * overwhelming, and a child with low mood has less capacity to choose, not more.
 */
export const PLEASANT_ACTIVITIES: PleasantActivity[] = [
  { id: 'dance', label: 'ارقص على أغنية تحبّها', emoji: '💃', minutes: 3, ageMin: 4, movement: true },
  { id: 'walk', label: 'امشِ في الخارج', emoji: '🚶', minutes: 10, ageMin: 5, movement: true },
  { id: 'ball', label: 'العب بالكرة', emoji: '⚽', minutes: 10, ageMin: 5, movement: true },
  { id: 'stretch', label: 'تمدّد وأطِل جسمك', emoji: '🤸', minutes: 5, ageMin: 5, movement: true },
  { id: 'jump', label: 'اقفز أو انطّ على الحبل', emoji: '🪢', minutes: 5, ageMin: 6, movement: true },
  { id: 'bike', label: 'اركب الدراجة', emoji: '🚲', minutes: 15, ageMin: 7, movement: true },
  { id: 'pet', label: 'العب مع حيوان أليف', emoji: '🐈', minutes: 10, ageMin: 4, movement: true },
  { id: 'draw', label: 'ارسم أو لوّن', emoji: '🎨', minutes: 10, ageMin: 4, movement: false },
  { id: 'music', label: 'استمع لموسيقى تحبّها', emoji: '🎧', minutes: 5, ageMin: 5, movement: false },
  { id: 'help', label: 'ساعد أحداً في البيت', emoji: '🤝', minutes: 10, ageMin: 6, movement: false },
  { id: 'call', label: 'تحدّث مع صديق أو قريب', emoji: '📞', minutes: 10, ageMin: 7, movement: false },
  { id: 'build', label: 'ابنِ شيئاً (مكعبات، بازل)', emoji: '🧱', minutes: 10, ageMin: 4, movement: false },
]

/** Activities a child of this age can actually do, movement-led first. */
export function activitiesForAge(age: number): PleasantActivity[] {
  const usable = PLEASANT_ACTIVITIES.filter(a => a.ageMin <= (Number.isFinite(age) && age > 0 ? age : 7))
  return [...usable].sort((a, b) => Number(b.movement) - Number(a.movement))
}

export type MoodOutcome = 'lifted' | 'unchanged' | 'dropped'

export interface MoodChange {
  before: MoodLevel
  after: MoodLevel
  delta: number
  outcome: MoodOutcome
  /**
   * True when the specialist should look at this run rather than the number
   * alone: mood still at the floor afterwards, or it went down. Not an alarm —
   * a prompt to ask the child about it.
   */
  needsAttention: boolean
  /** Shown to the child. Never congratulates them for feeling better. */
  childMessage: string
  /** Shown to the specialist in the result. */
  specialistNote: string
}

/**
 * Read one before/after pair.
 *
 * Deliberately even-handed: a child whose mood did not lift has not failed the
 * exercise, and the message they see must not imply otherwise. Behavioural
 * activation works over repetition, not in a single run, and a child taught to
 * perform improvement stops reporting honestly — which destroys the only thing
 * this measures.
 */
export function readMoodChange(before: MoodLevel, after: MoodLevel): MoodChange {
  const delta = after - before
  const outcome: MoodOutcome = delta > 0 ? 'lifted' : delta < 0 ? 'dropped' : 'unchanged'

  // Floor after the activity, or a drop: worth the specialist's eye either way.
  const needsAttention = after <= 1 || delta < 0

  let childMessage: string
  if (outcome === 'lifted') {
    childMessage = 'شعورك تحسّن بعد النشاط — لاحِظ ذلك، فهو معلومة مفيدة عنك.'
  } else if (outcome === 'unchanged') {
    childMessage = 'شعورك بقي كما هو، وهذا طبيعي تماماً. أحياناً يحتاج الأمر أكثر من مرة.'
  } else {
    childMessage = 'شعورك لم يتحسّن هذه المرة، ولا بأس بذلك إطلاقاً. أخبِر من يهتم بك كيف تشعر.'
  }

  let specialistNote: string
  if (after <= 1) {
    specialistNote = 'المزاج بقي في أدنى درجة بعد النشاط — اسأل الطفل مباشرةً، ولا تكتفِ بالرقم.'
  } else if (delta < 0) {
    specialistNote = 'انخفض المزاج بعد النشاط — تحقّق من ملاءمة النشاط أو من حدث سبقه.'
  } else if (delta === 0) {
    specialistNote = 'لا تغيّر في هذه المرة — التنشيط السلوكي يُقاس بالتكرار لا بجلسة واحدة.'
  } else {
    specialistNote = `ارتفع المزاج ${delta} درجة بعد النشاط.`
  }

  return { before, after, delta, outcome, needsAttention, childMessage, specialistNote }
}

/**
 * Which activities actually lift this child, across runs.
 *
 * Returns only activities tried at least twice: a single run is an anecdote,
 * and presenting it to a parent as "what works for your child" would be a
 * claim the data does not support.
 */
export function bestActivities(
  runs: Array<{ activityId: string; delta: number }>,
  minRuns = 2,
): Array<{ activityId: string; runs: number; avgDelta: number }> {
  const byId = new Map<string, number[]>()
  for (const r of runs) {
    const list = byId.get(r.activityId)
    if (list) list.push(r.delta)
    else byId.set(r.activityId, [r.delta])
  }
  return [...byId.entries()]
    .filter(([, deltas]) => deltas.length >= minRuns)
    .map(([activityId, deltas]) => ({
      activityId,
      runs: deltas.length,
      avgDelta: Math.round((deltas.reduce((s, n) => s + n, 0) / deltas.length) * 10) / 10,
    }))
    .sort((a, b) => b.avgDelta - a.avgDelta)
}
