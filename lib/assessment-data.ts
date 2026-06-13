export type DomainKey = 'sustained' | 'selective' | 'executive' | 'inhibition'

export interface AssessmentQuestion {
  id: number
  domain: DomainKey
  emoji: string
  text: string
}

export interface DomainInfo {
  label: string
  labelEn: string
  protocol: string
  color: string
  bg: string
  emoji: string
  description: string
  exerciseTips: string[]
}

export const DOMAINS: Record<DomainKey, DomainInfo> = {
  sustained: {
    label: 'الانتباه المستمر',
    labelEn: 'Sustained Attention',
    protocol: 'CPT — Continuous Performance Test',
    color: '#7C5CFC', bg: '#F3EEFF', emoji: '⏱️',
    description: 'القدرة على الاستمرار في التركيز على مهمة واحدة لفترة دون انقطاع',
    exerciseTips: ['تنفس الفقاعات', 'قذف الهدف المركّز', 'تمرين Pomodoro المعدّل'],
  },
  selective: {
    label: 'الانتباه الانتقائي',
    labelEn: 'Selective Attention',
    protocol: 'Go/No-Go + سيمون البصري',
    color: '#F59E0B', bg: '#FFFBEB', emoji: '🎯',
    description: 'القدرة على التركيز على المثير المستهدف مع تجاهل المشتتات',
    exerciseTips: ['لعبة قف واسمع', 'تمرين تتبع البصر', 'تحدي الانتباه البصري'],
  },
  executive: {
    label: 'الانتباه التنفيذي',
    labelEn: 'Executive Attention',
    protocol: 'DIT — Dual Integration Training',
    color: '#10B981', bg: '#ECFDF5', emoji: '🧩',
    description: 'القدرة على التخطيط والتنظيم وكبح الاستجابات الاندفاعية',
    exerciseTips: ['مزامنة الإيقاع الحركي', 'تحدي التسلسل المعكوس', 'الذاكرة العاملة'],
  },
  inhibition: {
    label: 'كبح المشتتات',
    labelEn: 'Distraction Inhibition',
    protocol: 'Cogmed-style + يوغا الحركة',
    color: '#EF4444', bg: '#FEF2F2', emoji: '🛑',
    description: 'القدرة على تجاهل الأفكار والحركات الداخلية التي تعيق التركيز',
    exerciseTips: ['يوغا الأطفال', 'المشي على خط التوازن', 'الحركة اليقظة'],
  },
}

export const DOMAIN_ORDER: DomainKey[] = ['sustained', 'selective', 'executive', 'inhibition']

export const QUESTIONS: AssessmentQuestion[] = [
  { id: 1,  domain: 'sustained',  emoji: '⏱️', text: 'يجد صعوبة في إكمال نشاط يتطلب تركيزاً لأكثر من 5 دقائق' },
  { id: 2,  domain: 'sustained',  emoji: '📚', text: 'ينتهي اهتمامه بالنشاط بسرعة قبل إكماله حتى لو كان يحبه' },
  { id: 3,  domain: 'sustained',  emoji: '🔔', text: 'يحتاج إلى تذكير متكرر لإعادته إلى المهمة' },
  { id: 4,  domain: 'sustained',  emoji: '🔀', text: 'يبدأ نشاطاً جديداً قبل الانتهاء من السابق' },
  { id: 5,  domain: 'sustained',  emoji: '📉', text: 'تتراجع جودة تركيزه كلما طال وقت المهمة' },
  { id: 6,  domain: 'selective',  emoji: '🔊', text: 'يتشتت انتباهه بسهولة بسبب الأصوات المحيطة' },
  { id: 7,  domain: 'selective',  emoji: '👀', text: 'ينجذب انتباهه لكل حركة أو شيء جديد في المحيط' },
  { id: 8,  domain: 'selective',  emoji: '🌀', text: 'يجد صعوبة في التركيز على شيء واحد عند وجود مشتتات' },
  { id: 9,  domain: 'selective',  emoji: '🔄', text: 'يصعب عليه تجاهل ما لا علاقة له بالمهمة' },
  { id: 10, domain: 'selective',  emoji: '⚡', text: 'يجد صعوبة في استعادة التركيز بعد أي انقطاع' },
  { id: 11, domain: 'executive',  emoji: '💥', text: 'يتصرف بتهور دون التفكير في العواقب' },
  { id: 12, domain: 'executive',  emoji: '📋', text: 'يجد صعوبة في تنظيم مهامه وترتيب أولوياته' },
  { id: 13, domain: 'executive',  emoji: '🔀', text: 'يواجه صعوبة في الانتقال من نشاط لآخر' },
  { id: 14, domain: 'executive',  emoji: '📜', text: 'يجد صعوبة في اتباع تعليمات متعددة الخطوات بالترتيب' },
  { id: 15, domain: 'executive',  emoji: '😤', text: 'يواجه صعوبة في كبح انفعالاته عند الإحباط أو الرفض' },
  { id: 16, domain: 'inhibition', emoji: '🦘', text: 'يتحرك باستمرار ولا يستطيع الجلوس هادئاً لوقت كافٍ' },
  { id: 17, domain: 'inhibition', emoji: '📢', text: 'يُصدر أصواتاً أو يتكلم بصوت عالٍ في أوقات غير مناسبة' },
  { id: 18, domain: 'inhibition', emoji: '⏳', text: 'يجد صعوبة شديدة في الانتظار دون حركة أو كلام' },
  { id: 19, domain: 'inhibition', emoji: '💭', text: 'تُلهيه أفكار أو تساؤلات متكررة أثناء تنفيذ المهام' },
  { id: 20, domain: 'inhibition', emoji: '🏃', text: 'يحتاج إلى حركة جسدية مستمرة حتى يستطيع التركيز' },
]

export const ANSWER_LABELS = ['أبداً', 'نادراً', 'أحياناً', 'دائماً']
export const ANSWER_COLORS = ['#22C55E', '#84CC16', '#F59E0B', '#EF4444']
export const ANSWER_BG     = ['#F0FFF4', '#F7FEE7', '#FFFBEB', '#FEF2F2']

export function getScoreLevel(score: number): { label: string; color: string; bg: string; emoji: string } {
  if (score <= 4)  return { label: 'ضمن الطبيعي',    color: '#16A34A', bg: '#F0FFF4', emoji: '🟢' }
  if (score <= 9)  return { label: 'يستحق الانتباه', color: '#D97706', bg: '#FFFBEB', emoji: '🟡' }
  return           { label: 'يحتاج تدخلاً',         color: '#DC2626', bg: '#FEF2F2', emoji: '🔴' }
}

export function getDomainScores(answers: Record<number, number>): Record<DomainKey, number> {
  const scores: Record<DomainKey, number> = { sustained: 0, selective: 0, executive: 0, inhibition: 0 }
  for (const q of QUESTIONS) {
    scores[q.domain] += answers[q.id] ?? 0
  }
  return scores
}
