// Static data shared by the in-session player (app/session/[id]/page.tsx):
// exercise catalog, video library, session phases, observation/assessment
// labels. Extracted out of page.tsx to keep that file focused on behavior.

// localStorage key for the specialist's remembered "prefer the bigger/compact
// screen" choice on the idle session screen — see idleChromePreferHidden in page.tsx.
export const CHROME_PREF_KEY = 'amine-academy:prefer-compact-chrome'

export type ActiveView =
  | { type: 'exercise'; id: string }
  | { type: 'assessment'; id: string }
  | null

export interface ObsEntry {
  text: string
  category: string
  color: string
  elapsed: number   // seconds since session start
  ts: string        // HH:MM
}

export interface ABCEntry {
  antecedent: string
  behavior: string
  consequence: string
  intensity: 1|2|3
  ts: string
  elapsed: number
}

export const PROMPT_CARDS = [
  { id: 'stop',    text: 'توقف وفكّر',     emoji: '🛑', bg: 'linear-gradient(135deg,#DC2626,#EF4444)', glow: '#EF4444' },
  { id: 'breathe', text: 'تنفس معي',       emoji: '🌬️', bg: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', glow: '#3B82F6' },
  { id: 'great',   text: 'أنت رائع!',      emoji: '⭐', bg: 'linear-gradient(135deg,#D97706,#F59E0B)', glow: '#F59E0B' },
  { id: 'listen',  text: 'استمع جيداً',    emoji: '👂', bg: 'linear-gradient(135deg,#7C3AED,#8B5CF6)', glow: '#8B5CF6' },
  { id: 'calm',    text: 'هدّئ نفسك',      emoji: '😌', bg: 'linear-gradient(135deg,#059669,#10B981)', glow: '#10B981' },
  { id: 'try',     text: 'حاول مرة أخرى', emoji: '💪', bg: 'linear-gradient(135deg,#EA580C,#F97316)', glow: '#F97316' },
]

export const QUICK_OBS: { category: string; color: string; bg: string; items: { text: string; icon: string }[] }[] = [
  {
    category: 'انتباه',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.15)',
    items: [
      { text: 'فقد التركيز',        icon: '😵' },
      { text: 'عاد للتركيز',        icon: '🎯' },
      { text: 'تشتت متكرر',         icon: '🌀' },
    ],
  },
  {
    category: 'سلوك',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
    items: [
      { text: 'أكمل بدون مساعدة',   icon: '✅' },
      { text: 'طلب مساعدة',         icon: '🙋' },
      { text: 'رفض النشاط',         icon: '🚫' },
    ],
  },
  {
    category: 'مزاج',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.15)',
    items: [
      { text: 'مزاج ممتاز',          icon: '😄' },
      { text: 'توتر / قلق',          icon: '😟' },
      { text: 'طلب استراحة',         icon: '⏸️' },
    ],
  },
  {
    category: 'أداء',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.15)',
    items: [
      { text: 'تحسن ملحوظ',          icon: '📈' },
      { text: 'صعوبة واضحة',         icon: '⚠️' },
      { text: 'أداء استثنائي',        icon: '🏆' },
    ],
  },
]

export interface SessionPhase {
  id: string
  label: string
  icon: string
  defaultMin: number
  color: string
}

export const SESSION_PHASES: SessionPhase[] = [
  { id: 'checkin',  label: 'استقبال وفحص الحالة', icon: '👋', defaultMin: 5,  color: '#3B82F6' },
  { id: 'warmup',   label: 'تدفئة',                icon: '🔥', defaultMin: 5,  color: '#F97316' },
  { id: 'main',     label: 'نشاط علاجي',           icon: '🎯', defaultMin: 35, color: '#7C5CFC' },
  { id: 'closure',  label: 'تعزيز وخاتمة',         icon: '🏆', defaultMin: 10, color: '#22C55E' },
  { id: 'family',   label: 'إحاطة الأسرة',          icon: '👨‍👩‍👧', defaultMin: 5,  color: '#F59E0B' },
]

export const EXERCISES = [
  { id:'memory-cards',      labelAr:'مطابقة البطاقات',         icon:'🃏', category:'ذاكرة',          color:'bg-purple-50 border-purple-200',  ageMin:5,  ageMax:22 },
  { id:'sequence-memory',   labelAr:'تذكر التسلسل',            icon:'🔢', category:'ذاكرة',          color:'bg-blue-50 border-blue-200',       ageMin:6,  ageMax:17 },
  { id:'n-back',            labelAr:'ذاكرة N-Back',             icon:'🧩', category:'ذاكرة',          color:'bg-indigo-50 border-indigo-200',   ageMin:8,  ageMax:22 },
  { id:'word-recall',       labelAr:'تذكر الكلمات',             icon:'📝', category:'ذاكرة',          color:'bg-violet-50 border-violet-200',   ageMin:6,  ageMax:17 },
  { id:'breathing',         labelAr:'تمارين التنفس',            icon:'🌬️', category:'تنظيم',          color:'bg-cyan-50 border-cyan-200',        ageMin:5,  ageMax:22 },
  { id:'tap-target',        labelAr:'التناسق الحركي',           icon:'🎯', category:'حركي',           color:'bg-orange-50 border-orange-200',   ageMin:5,  ageMax:22 },
  { id:'simon-says',        labelAr:'سايمون يقول',              icon:'🎨', category:'إدراكي',         color:'bg-green-50 border-green-200',     ageMin:5,  ageMax:17 },
  { id:'letter-match',      labelAr:'مطابقة الحروف',            icon:'🔤', category:'تعلّم',           color:'bg-amber-50 border-amber-200',     ageMin:5,  ageMax:11 },
  { id:'reaction-game',     labelAr:'سرعة رد الفعل',            icon:'⚡', category:'حركي',           color:'bg-yellow-50 border-yellow-200',   ageMin:5,  ageMax:22 },
  { id:'stroop-test',       labelAr:'ستروب — كبح الاستجابة',   icon:'🔵', category:'انتباه',          color:'bg-rose-50 border-rose-200',       ageMin:10, ageMax:22 },
  { id:'stop-signal',       labelAr:'توقف أو اكمل',             icon:'🛑', category:'اندفاعية',       color:'bg-red-50 border-red-200',         ageMin:8,  ageMax:22 },
  { id:'emotion-cards',     labelAr:'التعرف على المشاعر',       icon:'🎭', category:'اجتماعي',        color:'bg-pink-50 border-pink-200',       ageMin:5,  ageMax:17,  tags:['توحد'] },
  { id:'token-board',       labelAr:'لوح التعزيز',              icon:'🏅', category:'تعديل السلوك',   color:'bg-emerald-50 border-emerald-200', ageMin:5,  ageMax:22 },
  { id:'self-rating',       labelAr:'تقييم الذات',              icon:'🪞', category:'تعديل السلوك',   color:'bg-teal-50 border-teal-200',       ageMin:7,  ageMax:22 },
  { id:'verbal-fluency',    labelAr:'الطلاقة اللفظية',          icon:'🗣️', category:'معرفي',          color:'bg-sky-50 border-sky-200',         ageMin:5,  ageMax:22 },
  { id:'social-scenarios',  labelAr:'المواقف الاجتماعية',       icon:'🤝', category:'اجتماعي',        color:'bg-fuchsia-50 border-fuchsia-200', ageMin:5,  ageMax:22 },
  { id:'behavior-contract', labelAr:'عقد الجلسة',               icon:'📋', category:'تعديل السلوك',   color:'bg-lime-50 border-lime-200',       ageMin:7,  ageMax:22 },
  { id:'color-grid',             labelAr:'لوحة الألوان',            icon:'🎨', category:'إدراكي',       color:'bg-pink-50 border-pink-200',       ageMin:5,  ageMax:14 },
  { id:'pattern-match',          labelAr:'مطابقة الأنماط',          icon:'🔍', category:'إدراكي',       color:'bg-violet-50 border-violet-200',   ageMin:5,  ageMax:16 },
  { id:'word-builder',           labelAr:'بناء الكلمة',             icon:'🔤', category:'تعلّم',         color:'bg-emerald-50 border-emerald-200', ageMin:5,  ageMax:14 },
  { id:'auditory-memory',        labelAr:'الذاكرة السمعية',         icon:'🎧', category:'سمعي',          color:'bg-purple-50 border-purple-200',   ageMin:5,  ageMax:22 },
  { id:'listening-comprehension',labelAr:'فهم الاستماع',            icon:'🔊', category:'سمعي',          color:'bg-blue-50 border-blue-200',       ageMin:5,  ageMax:18 },
  { id:'picture-word-cards',     labelAr:'بطاقات الصورة والكلمة',  icon:'🖼️', category:'تعلّم',         color:'bg-teal-50 border-teal-200',       ageMin:4,  ageMax:14 },
  { id:'number-sequence',        labelAr:'تسلسل الأرقام',           icon:'🔢', category:'معرفي',          color:'bg-blue-50 border-blue-200',       ageMin:4,  ageMax:22 },
  { id:'shadow-match',           labelAr:'مطابقة الظلال',           icon:'🌑', category:'إدراكي',         color:'bg-gray-100 border-gray-300',       ageMin:4,  ageMax:12 },
  { id:'story-sequencing',       labelAr:'ترتيب القصة',             icon:'📖', category:'تفكير',          color:'bg-amber-50 border-amber-200',     ageMin:5,  ageMax:14 },
  { id:'waiting-game',           labelAr:'لعبة الانتظار',           icon:'⏳', category:'اندفاعية',      color:'bg-red-50 border-red-200',         ageMin:5,  ageMax:14,  tags:['توحد'] },
  { id:'social-problem-solving', labelAr:'كيف أتعامل؟',            icon:'😤', category:'اجتماعي',        color:'bg-pink-50 border-pink-200',       ageMin:6,  ageMax:18 },
  // ── انتباه ───────────────────────────────────────
  { id:'visual-search',         labelAr:'البحث البصري',            icon:'🔎', category:'انتباه',           color:'bg-cyan-50 border-cyan-200',       ageMin:5,  ageMax:22 },
  { id:'odd-one-out',           labelAr:'الغريب في المجموعة',      icon:'🤔', category:'انتباه',           color:'bg-indigo-50 border-indigo-200',   ageMin:5,  ageMax:17 },
  { id:'sustained-attention',   labelAr:'الانتباه المستمر',        icon:'👁️', category:'انتباه',           color:'bg-blue-50 border-blue-200',       ageMin:6,  ageMax:22 },
  { id:'flash-count',           labelAr:'عدّ السريع',              icon:'⚡', category:'انتباه',           color:'bg-yellow-50 border-yellow-200',   ageMin:5,  ageMax:22 },
  { id:'number-search',         labelAr:'البحث عن الأرقام',        icon:'🔍', category:'انتباه',           color:'bg-teal-50 border-teal-200',       ageMin:6,  ageMax:22 },
  // ── اندفاعية ─────────────────────────────────────
  { id:'go-no-go',              labelAr:'اضغط / لا تضغط',         icon:'🚦', category:'اندفاعية',         color:'bg-orange-50 border-orange-200',   ageMin:6,  ageMax:22 },
  { id:'balloon-control',       labelAr:'البالون الهادئ',          icon:'🎈', category:'اندفاعية',         color:'bg-red-50 border-red-200',         ageMin:5,  ageMax:14 },
  { id:'traffic-light',         labelAr:'إشارة المرور',            icon:'🚦', category:'اندفاعية',         color:'bg-green-50 border-green-200',     ageMin:5,  ageMax:22,  tags:['توحد'] },
  // ── اجتماعي ──────────────────────────────────────
  { id:'emotion-mirror',        labelAr:'مرآة المشاعر',            icon:'🪞', category:'اجتماعي',          color:'bg-fuchsia-50 border-fuchsia-200', ageMin:5,  ageMax:18 },
  { id:'conversation-starter',  labelAr:'كيف أبدأ الحديث؟',       icon:'💬', category:'اجتماعي',          color:'bg-teal-50 border-teal-200',       ageMin:6,  ageMax:22 },
  // ── سمعي ─────────────────────────────────────────
  { id:'sound-discrimination',  labelAr:'تمييز الأصوات',           icon:'👂', category:'سمعي',             color:'bg-violet-50 border-violet-200',   ageMin:5,  ageMax:22 },
  { id:'rhyme-detection',       labelAr:'اكتشاف القافية',          icon:'🎵', category:'سمعي',             color:'bg-pink-50 border-pink-200',       ageMin:5,  ageMax:14 },
  { id:'audio-sequence',        labelAr:'تسلسل الأصوات',           icon:'🔁', category:'سمعي',             color:'bg-indigo-50 border-indigo-200',   ageMin:5,  ageMax:17 },
  { id:'syllable-tap',          labelAr:'تقطيع المقاطع',           icon:'👋', category:'سمعي',             color:'bg-rose-50 border-rose-200',       ageMin:5,  ageMax:14,  tags:['عسر قراءة'] },
  // ── عسر قراءة ─────────────────────────────────────
  { id:'letter-reversal',       labelAr:'تمييز الحروف',            icon:'🔡', category:'تعلّم',             color:'bg-orange-50 border-orange-200',   ageMin:5,  ageMax:14,  tags:['عسر قراءة'] },
  // ── بصري / محاكاة ─────────────────────────────────
  { id:'matrix-puzzle',         labelAr:'أحجية المصفوفة',          icon:'🔲', category:'إدراكي',            color:'bg-violet-50 border-violet-200',   ageMin:6,  ageMax:22 },
  { id:'clock-reading',         labelAr:'قراءة الساعة',            icon:'🕐', category:'معرفي',             color:'bg-sky-50 border-sky-200',         ageMin:5,  ageMax:14 },
  // ── حركي ─────────────────────────────────────────
  { id:'sequence-tap',          labelAr:'النقر بالتسلسل',          icon:'🟣', category:'حركي',             color:'bg-purple-50 border-purple-200',   ageMin:5,  ageMax:22 },
  { id:'target-tracking',       labelAr:'تتبع الهدف',              icon:'🎯', category:'حركي',             color:'bg-emerald-50 border-emerald-200', ageMin:5,  ageMax:17 },
  { id:'finger-gym',            labelAr:'جمباز الأصابع',           icon:'🥁', category:'حركي',             color:'bg-amber-50 border-amber-200',     ageMin:5,  ageMax:22 },
  // ── معرفي ────────────────────────────────────────
  { id:'category-sort',         labelAr:'تصنيف الأشياء',           icon:'🗂️', category:'معرفي',            color:'bg-sky-50 border-sky-200',         ageMin:4,  ageMax:14 },
  { id:'math-flash',            labelAr:'الحساب السريع',           icon:'🔢', category:'معرفي',            color:'bg-blue-50 border-blue-200',       ageMin:6,  ageMax:22 },
  { id:'analogies',             labelAr:'العلاقات والقياسات',      icon:'🧩', category:'معرفي',            color:'bg-teal-50 border-teal-200',       ageMin:7,  ageMax:22 },
  // ── تنظيم ────────────────────────────────────────
  { id:'body-scan',             labelAr:'فحص الجسم',               icon:'🫁', category:'تنظيم',            color:'bg-cyan-50 border-cyan-200',       ageMin:6,  ageMax:22 },
  { id:'mood-meter',            labelAr:'مقياس المزاج',            icon:'🌡️', category:'تنظيم',            color:'bg-amber-50 border-amber-200',     ageMin:5,  ageMax:22 },
  { id:'calm-corner',           labelAr:'ركن الهدوء',              icon:'🧘', category:'تنظيم',            color:'bg-teal-50 border-teal-200',       ageMin:5,  ageMax:22 },
  { id:'emotion-volume',        labelAr:'حجم الانفعال',            icon:'📊', category:'تنظيم',            color:'bg-orange-50 border-orange-200',   ageMin:6,  ageMax:22 },
  // ── تعديل السلوك ──────────────────────────────────
  { id:'daily-goals',           labelAr:'أهدافي اليوم',            icon:'🎯', category:'تعديل السلوك',    color:'bg-green-50 border-green-200',     ageMin:5,  ageMax:22 },
  { id:'choice-board',          labelAr:'لوح الاختيارات',          icon:'🗳️', category:'تعديل السلوك',    color:'bg-violet-50 border-violet-200',   ageMin:4,  ageMax:14,  tags:['توحد'] },
  // ── تفكير ────────────────────────────────────────
  { id:'pattern-puzzle',        labelAr:'أكمل النمط',              icon:'🔮', category:'تفكير',            color:'bg-indigo-50 border-indigo-200',   ageMin:4,  ageMax:14 },
  { id:'if-then',               labelAr:'ماذا سيحدث؟',            icon:'🔗', category:'تفكير',            color:'bg-sky-50 border-sky-200',         ageMin:5,  ageMax:17 },
  { id:'problem-solver',        labelAr:'حل المشكلة',              icon:'💡', category:'تفكير',            color:'bg-yellow-50 border-yellow-200',   ageMin:6,  ageMax:22 },
  // ── تعلّم ─────────────────────────────────────────
  { id:'spelling-bee',          labelAr:'الإملاء',                 icon:'🐝', category:'تعلّم',            color:'bg-rose-50 border-rose-200',       ageMin:5,  ageMax:14 },
  { id:'reading-cards',         labelAr:'بطاقات القراءة',          icon:'📖', category:'تعلّم',            color:'bg-blue-50 border-blue-200',       ageMin:5,  ageMax:14 },
  { id:'span-extension',        labelAr:'امتداد الذاكرة',           icon:'🔢', category:'ذاكرة',            color:'bg-indigo-50 border-indigo-200',   ageMin:6,  ageMax:22 },
  { id:'direction-follow',      labelAr:'اتباع الاتجاهات',         icon:'🧭', category:'إدراكي',           color:'bg-cyan-50 border-cyan-200',       ageMin:5,  ageMax:17 },
  { id:'logic-sort',            labelAr:'الترتيب المنطقي',         icon:'📊', category:'تفكير',            color:'bg-emerald-50 border-emerald-200', ageMin:5,  ageMax:17 },
  // ── توحد ─────────────────────────────────────────
  { id:'visual-match',          labelAr:'مطابقة الصور',             icon:'🔮', category:'توحد',             color:'bg-purple-50 border-purple-200',   ageMin:3,  ageMax:14 },
  { id:'visual-schedule',       labelAr:'جدولي اليومي',             icon:'🗓️', category:'توحد',             color:'bg-blue-50 border-blue-200',       ageMin:3,  ageMax:14 },
  { id:'first-then-board',      labelAr:'أولاً ثم',                 icon:'⬛', category:'توحد',             color:'bg-orange-50 border-orange-200',   ageMin:3,  ageMax:14 },
  { id:'imitation-mirror',      labelAr:'التقليد الحركي',           icon:'🪞', category:'توحد',             color:'bg-teal-50 border-teal-200',       ageMin:3,  ageMax:12 },
  { id:'sensory-checkin',       labelAr:'فحص الحواس',               icon:'🫁', category:'توحد',             color:'bg-indigo-50 border-indigo-200',   ageMin:3,  ageMax:22 },
  // ── رياضي ──────────────────────────────────────────
  { id:'jumping-jacks',    labelAr:'قفز النجمة',           icon:'⭐', category:'رياضي', color:'bg-green-50 border-green-200',     ageMin:5,  ageMax:22 },
  { id:'obstacle-circuit', labelAr:'دائرة الحواجز',         icon:'🏅', category:'رياضي', color:'bg-orange-50 border-orange-200',   ageMin:5,  ageMax:17 },
  { id:'balance-walk',     labelAr:'خط التوازن',            icon:'⚖️', category:'رياضي', color:'bg-blue-50 border-blue-200',       ageMin:5,  ageMax:22 },
  { id:'tiger-crawl',      labelAr:'الزحف المتقاطع',        icon:'🐆', category:'رياضي', color:'bg-amber-50 border-amber-200',     ageMin:5,  ageMax:17 },
  { id:'ball-throw',       labelAr:'رمي الكرة والتقاطها',  icon:'⚽', category:'رياضي', color:'bg-emerald-50 border-emerald-200', ageMin:5,  ageMax:22 },
  { id:'stretching',       labelAr:'تمارين التمدد',         icon:'🧘', category:'رياضي', color:'bg-teal-50 border-teal-200',       ageMin:5,  ageMax:22 },
  { id:'body-percussion',  labelAr:'الإيقاع الجسدي',        icon:'🥁', category:'رياضي', color:'bg-purple-50 border-purple-200',   ageMin:5,  ageMax:22 },

  // ── بازل ──────────────────────────────────────────────────────────────────
  { id:'jigsaw-puzzle',    labelAr:'أكمل الصورة',             icon:'🧩', category:'بازل',   color:'bg-purple-50 border-purple-200',  ageMin:4,  ageMax:16 },
  { id:'picture-puzzle',   labelAr:'أكمل الأحجية',            icon:'🎭', category:'بازل',   color:'bg-indigo-50 border-indigo-200',  ageMin:5,  ageMax:16 },
  { id:'matrix-puzzle',    labelAr:'أحجية المصفوفة',           icon:'🔲', category:'بازل',   color:'bg-violet-50 border-violet-200',  ageMin:6,  ageMax:22 },

  // ── محاكاة ─────────────────────────────────────────────────────────────────
  { id:'pattern-board',    labelAr:'انسخ النمط',               icon:'🎯', category:'محاكاة', color:'bg-rose-50 border-rose-200',      ageMin:4,  ageMax:18 },
  { id:'color-sudoku',     labelAr:'سودوكو الألوان',           icon:'🎨', category:'محاكاة', color:'bg-orange-50 border-orange-200',  ageMin:5,  ageMax:22 },
  { id:'money-counter',    labelAr:'عدّ النقود',               icon:'💰', category:'محاكاة', color:'bg-yellow-50 border-yellow-200',  ageMin:5,  ageMax:18 },

  // ── مهارات قرائية ──────────────────────────────────────────────────────────
  { id:'syllable-tap',     labelAr:'تقطيع المقاطع',           icon:'👋', category:'سمعي',   color:'bg-rose-50 border-rose-200',      ageMin:5,  ageMax:14, tags:['عسر قراءة'] },
  { id:'letter-reversal',  labelAr:'تمييز الحروف',            icon:'🔡', category:'تعلّم',  color:'bg-orange-50 border-orange-200',  ageMin:5,  ageMax:14, tags:['عسر قراءة'] },

  // ── معرفي ──────────────────────────────────────────────────────────────────
  { id:'clock-reading',    labelAr:'قراءة الساعة',            icon:'🕐', category:'معرفي',  color:'bg-sky-50 border-sky-200',        ageMin:5,  ageMax:14 },

  // ── تكامل حسي-حركي / عسر القراءة ─────────────────────────────────────────
  { id:'cross-lateral',    labelAr:'عبور خط المنتصف',        icon:'🤸', category:'حركي',   color:'bg-violet-50 border-violet-200',  ageMin:4,  ageMax:18, tags:['عسر قراءة','تنسيق'] },
]

// Exercises whose component renders its own post-completion results screen
// (score, feedback, "play again"/"finish") and should stay mounted until the
// user dismisses it, instead of being closed the instant onComplete fires.
export const SELF_CLOSING_RESULTS = new Set(['picture-word-cards'])

// ── مكتبة الفيديو ──────────────────────────────────────────────────────────
export const VIDEO_LIBRARY: Record<string, { desc: string; tips: string[]; videoId?: string }> = {
  'breathing':           { videoId: 'IB1JNAcc2mc', desc: 'يُهدّئ الجهاز العصبي ويقلل الاندفاعية والقلق ويُحسّن التركيز.', tips: ['استنشق 4 عدّات من الأنف', 'حبس 4 عدّات', 'زفير بطيء 6 عدّات', 'كرر 3-5 مرات'] },
  'calm-corner':         { videoId: 'u5t32hucFRQ', desc: 'مساحة آمنة يلجأ إليها الطفل عند الإرهاق لتنظيم نفسه ذاتياً.', tips: ['بيئة هادئة وخافتة الإضاءة', 'أدوات حسية: كرة ضغط، سماعات', 'لا يُستخدم كعقاب', 'علّم الطفل متى يذهب إليه'] },
  'jumping-jacks':       { videoId: 'iFT-ObTJVEI', desc: 'ينشّط الجسم ويفرغ الطاقة الزائدة ويُحسّن التنسيق الثنائي.', tips: ['3 مجموعات × 10 قفزات', 'استخدمه قبل جلسات التركيز', 'تأكد من تزامن الذراعين والساقين', 'زد الوتيرة تدريجياً'] },
  'stretching':          { videoId: 'QeVh3NVfa0k', desc: 'يُهدّئ الجسم وينمّي الوعي الجسدي ويُسهّل الانتقال للاسترخاء.', tips: ['كل حركة 10-15 ثانية', 'تنفس بعمق أثناء التمدد', 'ابدأ بالرقبة ثم الكتفين ثم الظهر', 'حركات بطيئة هادئة'] },
  'balance-walk':        { videoId: '7tcQh-xQDUI', desc: 'يُنشّط المخيخ المسؤول عن الانتباه ويُحسّن التنسيق بين الجانبين.', tips: ['ضع شريطاً لاصقاً على الأرض', 'امشِ ببطء مركّزاً على التوازن', 'جرّب بأعين مغمضة لاحقاً', 'احمل غرضاً على رأسك لزيادة الصعوبة'] },
  'tiger-crawl':         { videoId: '_HJRY9j_Y9Y', desc: 'يُنشّط التكامل بين نصفي المخ وهو أساسي للقراءة والانتباه.', tips: ['اليد اليمنى مع الركبة اليسرى في آنٍ', 'الزحف ببطء مع الوعي الكامل', '5-7 دقائق قبل التمارين المعرفية', 'مناسب لجميع الأعمار'] },
  'body-percussion':     { videoId: 'VUlQBDSG9Ps', desc: 'يُحسّن التنسيق الدقيق والإيقاع الزمني والانتباه المستمر.', tips: ['ابدأ بنمط بسيط: تصفيق + ضرب الركبة', 'كرر 3 مرات قبل أن يؤديه وحده', 'زد التعقيد تدريجياً', 'استخدم موسيقى هادئة'] },
  'body-scan':           { videoId: 'Y96Qq7UE_qc', desc: 'يُطوّر الوعي الجسدي ويُساعد على رصد التوتر قبل الانفجار الانفعالي.', tips: ['الطفل مستلقٍ أو جالس بهدوء', 'انتقل من القدمين للرأس', 'اطلب منه توصيف ما يشعر به', '10 دقائق كافية للتأثير'] },
  'emotion-cards':       { videoId: '1-8ntwLiNcw', desc: 'يُطوّر الذكاء الانفعالي والقدرة على قراءة تعابير الوجه.', tips: ['استخدم صوراً حقيقية لأشخاص', 'اربط المشاعر بمواقف يومية', 'اطلب منه تمثيل المشعر بجسده', 'ابدأ بالمشاعر الأساسية الستة'] },
  'emotion-mirror':      { videoId: 'ZWTq-HazzsU', desc: 'يُطوّر التواصل الاجتماعي من خلال تقليد تعابير الوجه.', tips: ['قفا أمام مرآة معاً', 'ابدأ بمشاعر واضحة: فرح، حزن', 'تناوبا الأدوار', 'اربط كل تعبير بحدث يومي'] },
  'social-scenarios':    { videoId: 'tAVKSckForg', desc: 'يُطوّر التعامل مع المواقف الاجتماعية وحل النزاعات بشكل بناء.', tips: ['استخدم مواقف من حياة الطفل الفعلية', 'اسأل: ماذا تفعل؟ وماذا سيحدث؟', 'ناقش أكثر من حل ممكن', 'العب أدواراً تمثيلية'] },
  'social-problem-solving': { videoId: 'ejjM1Apj56c', desc: 'يُطوّر التفكير التسلسلي والقدرة على إيجاد الحلول البديلة.', tips: ['SODAS: موقف، خيارات، مشكلات، نتائج، مفاضلة', 'استخدم قصصاً مصورة', 'فكّر بصوت عالٍ نموذجاً له', 'اربطه بمواقف حديثة'] },
  'token-board':         { videoId: 'FzEI_fJYmFI', desc: 'يُحفّز الطفل ويعزز السلوك الإيجابي من خلال مكافآت فورية.', tips: ['5-10 رموز لكل مكافأة', 'حدد السلوك المطلوب بوضوح', 'المكافأة فورية وليست مؤجلة', 'تناقص تدريجي مع التحسن'] },
  'behavior-contract':   { videoId: 'WQlWjWUv06U', desc: 'يُوضّح التوقعات والمكافآت ويعزز التزام الطفل بأهدافه.', tips: ['اكتب الاتفاق معه لا له', 'هدف واحد فقط في البداية', 'مكافأة محددة وقابلة للتحقيق', 'راجعه أسبوعياً'] },
  'traffic-light':       { videoId: '9VmWNdmtfxk', desc: 'يُعلّم التوقف والتفكير قبل التصرف — أداة فعّالة لكبح الاندفاعية.', tips: ['أحمر: توقف وتنفس', 'أصفر: فكر في خياراتك', 'أخضر: تصرف', 'طبّق على مواقف يومية حقيقية'] },
  'stop-signal':         { videoId: 'B6DASGn4HWI', desc: 'يُطوّر القدرة على كبح الاستجابة الاندفاعية وهو الأكثر فاعلية مع ADHD.', tips: ['ابدأ بزمن استجابة طويل ثم قلّصه', 'راقب دقة التوقف لا السرعة فقط', '10-15 دقيقة للجلسة', 'سجّل التحسن عبر الجلسات'] },
  'mood-meter':          { videoId: 'h8fCgLD0ziU', desc: 'يُطوّر الوعي الانفعالي ويُساعد الطفل على تسمية مشاعره وشدتها.', tips: ['محور أفقي: الطاقة (عالية/منخفضة)', 'محور رأسي: الشعور (إيجابي/سلبي)', 'ابدأ الجلسة بتحديد المزاج', 'استخدم الألوان للمساعدة'] },
  'verbal-fluency':      { videoId: 'BBlaaSKP4HM', desc: 'يُطوّر الذاكرة الدلالية والبحث السريع في مخازن الذاكرة.', tips: ['فئات مألوفة: حيوانات، أكل، ألوان', 'دقيقة واحدة لكل فئة', 'سجّل العدد وقارنه بين الجلسات', 'زد الصعوبة بفئات أكثر تخصصاً'] },
  'finger-gym':          { videoId: 'F8bEmfEP-FQ', desc: 'يُطوّر الحركة الدقيقة ويُقوّي عضلات الأصابع للكتابة.', tips: ['فرد الأصابع واحداً تلو الآخر', 'ضرب كل أصبع بالإبهام', 'عجن الطين أو كرات الضغط', '5 دقائق قبل جلسات الكتابة'] },
  'memory-cards':        { videoId: 'J0v-bX1u2Kc', desc: 'يُطوّر الذاكرة البصرية قصيرة المدى والانتباه الانتقائي.', tips: ['ابدأ بـ 6 بطاقات (3 أزواج)', 'زد تدريجياً حتى 20 بطاقة', 'شجعه على تسمية الصور بصوت عالٍ', 'راقب زمن الإنجاز'] },
  'sequence-memory':     { videoId: 'gv7EnAeagkA', desc: 'يُطوّر الذاكرة العاملة وترتيب المعلومات في الزمن.', tips: ['ابدأ بتسلسل من 3 عناصر', 'استخدم أرقاماً ثم ألواناً ثم صوراً', 'سرعة التقديم: 1 ثانية/عنصر', 'أضف عنصراً كل 2-3 جلسات'] },
  'conversation-starter':{ videoId: 'CBEyNj-IkUM', desc: 'يُعلّم الطفل كيف يبدأ محادثة ويُبقيها مستمرة.', tips: ['ابدأ بسؤال عن الطرف الآخر', 'تناوبا البدء والاستمرار', 'استخدم موضوعات مشتركة', 'راقب لغة الجسد'] },
  'choice-board':        { videoId: 'ptOcxeje2r4', desc: 'يمنح الطفل شعوراً بالسيطرة مما يُقلّل مقاومة التعليمات.', tips: ['2-3 خيارات كافية', 'تأكد أن كل الخيارات مقبولة', 'الطفل يختار ويلتزم باختياره', 'استخدم صوراً للأطفال الصغار'] },
  'daily-goals':         { videoId: 'p6FeVyw0ZNU', desc: 'يُطوّر التخطيط والتنظيم الذاتي ويُحسّن الشعور بالكفاءة.', tips: ['هدفان كحد أقصى', 'الأهداف قابلة للقياس والتحقيق', 'راجع الأهداف نهاية الجلسة', 'احتفل بالإنجاز مهما كان صغيراً'] },
  'ball-throw':          { videoId: 'odveiZjwnIg', desc: 'يُحسّن التنسيق البصري الحركي والتتبع البصري وسرعة رد الفعل.', tips: ['ابدأ بمسافة قريبة', 'تناوبا الرمي والإمساك', 'عدّ الرميات الناجحة', 'أضف مسافة تدريجياً'] },
  'emotion-volume':      { videoId: 'pNxlVLwh2vc', desc: 'يُطوّر القدرة على تقدير شدة الانفعالات والتحكم في ردود الفعل.', tips: ['مقياس 1-10 أو صور صوتية', 'اربط الرقم بموقف حقيقي', 'ناقش متى يكون رقم 8 مناسباً', 'علّمه استراتيجيات خفض الرقم'] },
}

export const ASSESSMENTS = [
  { id:'adhd',               labelAr:'مقياس ADHD',              icon:'⚡', color:'bg-blue-50 border-blue-200'    },
  { id:'attention-domains',  labelAr:'أنماط الانتباه — SNAP-IV', icon:'🧠', color:'bg-purple-50 border-purple-200' },
  { id:'learning-difficulties', labelAr:'صعوبات التعلم',        icon:'📚', color:'bg-amber-50 border-amber-200'  },
]

export const SESSION_TYPE_CFG: Record<string, { label: string; color: string; isAssessment?: boolean }> = {
  assessment:   { label: 'جلسة تقييمية',       color: 'bg-amber-50 text-amber-700 border-amber-200',  isAssessment: true },
  followup:     { label: 'جلسة متابعة',         color: 'bg-blue-50 text-blue-700 border-blue-200' },
  emergency:    { label: 'استشارة طارئة',       color: 'bg-red-50 text-red-700 border-red-200' },
  consultation: { label: 'استشارة الوالدين',   color: 'bg-purple-50 text-purple-700 border-purple-200' },
  training:     { label: 'جلسة تدريبية مكثفة', color: 'bg-green-50 text-green-700 border-green-200' },
  review:       { label: 'مراجعة البرنامج',     color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
}

export const DIAG_LABELS: Record<string, string> = {
  ADHD: 'ADHD', AUTISM: 'توحد', 'ADHD+AUTISM': 'ADHD+توحد', OTHER: 'أخرى',
}
export const SEVERITY_LABELS: Record<number, string> = { 1: 'خفيف', 2: 'متوسط', 3: 'شديد' }
