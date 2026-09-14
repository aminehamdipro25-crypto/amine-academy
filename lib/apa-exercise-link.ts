// Links each phase of an APA session plan to the real exercises already in the
// platform's exercise library (lib/exercises-data.ts).
//
// Why a separate file: apa-plan-data.ts holds the authored clinical guidance and
// stays a single reviewable block of text. This file is the *mapping* — which
// catalogue exercise actually delivers a given phase — so the plan text and the
// exercise protocols never diverge into two copies of the same content. The
// planner shows the catalogue's own instructions, not a re-typed version.
//
// Keys are exercise `titleAr` values. apa-exercise-link.test.ts fails the build
// if any key stops matching a catalogue entry, or if a linked exercise's age
// groups no longer overlap the band it is linked from.
import { DEFAULT_EXERCISES } from './exercises-data'
import { apaPlanData, type ApaCondition } from './apa-plan-data'
import type { ExerciseCategory } from './types'

/** The slice of a catalogue exercise the planner shows inside a phase card. */
export interface ApaLinkedExercise {
  titleAr: string
  category: ExerciseCategory
  durationMinutes: number
  instructionsAr: string[]
  psychologyObjectiveAr: string
  /** Catalogue field, authored in English — shown verbatim rather than paraphrased. */
  contraindications: string[]
}

/** condition → age-band range → phase name → catalogue `titleAr` keys. */
const PHASE_EXERCISES: Record<ApaCondition, Record<string, Record<string, string[]>>> = {
  adhd: {
    '4 - 6 سنوات': {
      'الإحماء الحسي-الحركي': ['دائرة مشية الحيوانات'],
      'محطة 1 - التوازن': ['المشي على خط التوازن', 'خط التوازن'],
      'محطة 2 - الرمي والالتقاط': ['رمي الكرة والتقاطها', 'قذف الهدف المركّز'],
      'محطة 3 - الزحف والعبور': ['دائرة الحواجز', 'الزحف المتقاطع'],
      'محطة 4 - الإيقاع الحركي': ['الإيقاع الجسدي', 'مزامنة الإيقاع الحركي'],
      'التهدئة والإغلاق': ['تنفس الفقاعات', 'تمارين التمدد والمرونة'],
    },
    '6 - 9 سنوات': {
      'الإحماء - الضوء الأحمر والأخضر': ['لعبة قف واسمع', 'سايمون يقول — كبح متقدم'],
      'محطة 1 - التصويب المصغر': ['قذف الهدف المركّز'],
      'محطة 2 - سباق العقبات المؤقت': ['دورة التنقل بين العقبات', 'دائرة الحواجز'],
      'محطة 3 - لعبة تعاونية مصغرة': ['تمرير الكرة التعاوني'],
      // The plan's own text calls for 4-4-4 breathing here, but the catalogue's
      // box-breathing protocol is authored for 12+. Link the 5-11 breathing
      // protocol instead rather than hand a specialist an out-of-band exercise.
      'التهدئة والإغلاق': ['تنفس الفقاعات', 'تمارين التمدد والمرونة', 'نظام النقاط اليومي (بنك المكافآت)'],
    },
    '9 - 12 سنة': {
      'الإحماء التفاعلي': ['تدريب الانتباه المستمر بالحركة (استجب / امتنع)', 'تدريب سرعة رد الفعل'],
      'مسار خفة الحركة (Agility)': ['دورة التنقل بين العقبات', 'تحدي التسلسل الحركي'],
      'لعبة جماعية معدلة': ['تمرير الكرة التعاوني', 'لعبة الحركة المرايا'],
      'التهدئة والتقييم الذاتي': ['الاسترخاء العضلي التدريجي', 'فحص حالتي — مناطق التنظيم الأربع'],
    },
    '12 - 15 سنة': {
      'الإحماء بقيادة المراهق': ['تمارين التمدد والمرونة', 'الحركة اليقظة: التأمل المشي'],
      'دائرة تدريب لياقة معدلة': ['قفز النجمة', 'تمرين الإيقاع والتنسيق'],
      'نشاط رياضي موجّه (فردي أو جماعي)': ['تحدي التسلسل الحركي', 'برنامج السباحة المعدلة'],
      'التهدئة وتنظيم ذاتي متقدم': ['الاسترخاء العضلي التدريجي', 'تقنية التأريض 5-4-3-2-1', 'ترموميتر الغضب وبروتوكول التهدئة'],
    },
  },
  asd: {
    '4 - 6 سنوات': {
      'عرض الجدول المرئي': ['القصة الاجتماعية: الانتقال بين الأنشطة'],
      'إحماء حسي': ['بروتوكول الضغط العميق وإعادة ضبط الحس العميق', 'الزحف المتقاطع'],
      'محطة اللمس والمسارات الحسية': ['مسح الجسم الحسي', 'التمييز بين أصوات الحيوانات'],
      'محطة التوازن الموجّه': ['خط التوازن', 'المشي على خط التوازن'],
      'محطة الرمي البسيط': ['رمي الكرة والتقاطها'],
      'التهدئة - الركن الهادئ': ['بروتوكول الضغط العميق وإعادة ضبط الحس العميق', 'تنفس الفقاعات'],
    },
    '6 - 9 سنوات': {
      'مراجعة الجدول المرئي وبطاقة الاستراحة': ['القصة الاجتماعية: الانتقال بين الأنشطة'],
      'دائرة حسية-حركية ثابتة': ['بروتوكول الضغط العميق وإعادة ضبط الحس العميق', 'الزحف المتقاطع', 'مسح الجسم الحسي'],
      'محطة التعاون الثنائي': ['تمرير الكرة التعاوني', 'لعبة الحركة المرايا'],
      'محطة المهارات الحركية الكبرى': ['دائرة الحواجز', 'دائرة مشية الحيوانات'],
      'نشاط جديد مع قصة اجتماعية': ['القصة الاجتماعية: الانتقال بين الأنشطة'],
      'التهدئة والإغلاق البصري': ['تمارين التمدد والمرونة', 'يوغا الأطفال — التركيز والهدوء'],
    },
    '9 - 12 سنة': {
      'إحماء حسي-حركي مألوف': ['الزحف المتقاطع', 'الإيقاع الجسدي'],
      'مسار التخطيط الحركي': ['دورة التنقل بين العقبات', 'تحدي التسلسل الحركي'],
      'نشاط جماعي بأدوار محددة': ['تمرير الكرة التعاوني', 'لعبة الحركة المرايا'],
      'استراحة حسية عند الطلب': ['تقنية التأريض 5-4-3-2-1', 'بروتوكول الضغط العميق وإعادة ضبط الحس العميق'],
      'التهدئة والتقييم البصري': ['يوغا الأطفال — التركيز والهدوء', 'فحص حالتي — مناطق التنظيم الأربع'],
    },
    '12 - 15 سنة': {
      'إحماء بقيادة ذاتية متزايدة': ['تمارين التمدد والمرونة', 'الحركة اليقظة: التأمل المشي'],
      'النشاط الوظيفي الرئيسي': ['برنامج السباحة المعدلة', 'تمرين الإيقاع والتنسيق'],
      'دور وظيفي/تطوعي': ['إتقان الروتين اليومي'],
      'توثيق ذاتي للتقدم': ['نظام النقاط اليومي (بنك المكافآت)'],
      'التهدئة والمناصرة الذاتية': ['الاسترخاء العضلي التدريجي', 'بروتوكول بدء المحادثة (PEERS)'],
    },
  },
}

/** Catalogue `titleAr` keys referenced by a phase, or [] when none are linked. */
export function exerciseKeysForPhase(cond: ApaCondition, range: string, phase: string): string[] {
  return PHASE_EXERCISES[cond]?.[range]?.[phase] ?? []
}

/** Every catalogue key referenced anywhere in the plans — deduplicated. */
export function allLinkedExerciseKeys(): string[] {
  const keys = new Set<string>()
  for (const cond of Object.keys(PHASE_EXERCISES) as ApaCondition[]) {
    for (const range of Object.keys(PHASE_EXERCISES[cond])) {
      for (const phase of Object.keys(PHASE_EXERCISES[cond][range])) {
        for (const k of PHASE_EXERCISES[cond][range][phase]) keys.add(k)
      }
    }
  }
  return [...keys]
}

/**
 * The trimmed catalogue entries the planner needs, keyed by `titleAr`.
 *
 * Only linked exercises are included, and only the fields the phase card shows —
 * the full catalogue is ~115KB and must not be shipped to the browser whole.
 * Built on the server and handed to the client planner as a prop.
 */
export function buildLinkedExerciseMap(): Record<string, ApaLinkedExercise> {
  const wanted = new Set(allLinkedExerciseKeys())
  const out: Record<string, ApaLinkedExercise> = {}
  for (const ex of DEFAULT_EXERCISES) {
    if (!wanted.has(ex.titleAr)) continue
    out[ex.titleAr] = {
      titleAr: ex.titleAr,
      category: ex.category,
      durationMinutes: ex.durationMinutes,
      instructionsAr: ex.instructionsAr,
      psychologyObjectiveAr: ex.psychologyObjectiveAr,
      contraindications: ex.contraindications,
    }
  }
  return out
}

/**
 * The plan's age bands (4-6, 6-9, 9-12, 12-15) against the catalogue's own
 * groups. 9-12 spans both catalogue groups, so either is acceptable there.
 */
export const BAND_AGE_GROUPS: Record<string, string[]> = {
  '4 - 6 سنوات': ['5-11'],
  '6 - 9 سنوات': ['5-11'],
  '9 - 12 سنة': ['5-11', '12-17'],
  '12 - 15 سنة': ['12-17'],
}

/** Phase names per (condition, range) as authored — used by the drift test. */
export function planPhaseNames(cond: ApaCondition, range: string): string[] {
  const group = apaPlanData[cond].groups.find(g => g.range === range)
  return group ? group.session.map(s => s.phase) : []
}

/** The mapping itself, exposed for the drift test. */
export const APA_PHASE_EXERCISES = PHASE_EXERCISES
