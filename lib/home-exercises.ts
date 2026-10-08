// The curated subset of exercises safe for home practice — shared by the parent
// practice page and the specialist's home-plan assignment picker so both agree
// on which exercises exist and how they're labelled.
//
// Deliberately NOT here: the assessment battery (span-extension, backward span,
// sustained-attention, visual-search, auditory-memory). Those are measurement
// instruments — practising them at home inflates the score and destroys the
// baseline the specialist compares against. They stay in the specialist's
// toolkit only.
export interface HomeExercise {
  id: string
  labelAr: string
  icon: string
  description: string
  ageMin: number
  category: string
}

export const HOME_EXERCISES: HomeExercise[] = [
  { id: 'memory-cards',       labelAr: 'بطاقات الذاكرة',      icon: '🃏', description: 'لعبة الذاكرة الكلاسيكية — اقلب البطاقات وابحث عن أزواج',     ageMin: 4,  category: 'ذاكرة' },
  { id: 'breathing',          labelAr: 'تمرين التنفس',         icon: '🫁', description: 'تنفس عميق موجَّه للاسترخاء والهدوء',                            ageMin: 4,  category: 'استرخاء' },
  { id: 'emotion-cards',      labelAr: 'بطاقات المشاعر',       icon: '😊', description: 'تعرّف على المشاعر المختلفة وتعلّم كيف تعبّر عنها',              ageMin: 4,  category: 'عاطفي' },
  { id: 'balloon-control',    labelAr: 'تحكّم بالبالون',       icon: '🎈', description: 'تمرين التنفس البطني بطريقة ممتعة',                              ageMin: 5,  category: 'استرخاء' },
  { id: 'simon-says',         labelAr: 'سايمون يقول',          icon: '🎮', description: 'لعبة اتباع التعليمات والانتباه',                                ageMin: 5,  category: 'انتباه' },
  { id: 'calm-corner',        labelAr: 'زاوية الهدوء',         icon: '🧘', description: 'نشاط مريح للتهدئة والاسترخاء',                                  ageMin: 4,  category: 'استرخاء' },
  { id: 'reading-cards',      labelAr: 'بطاقات القراءة',       icon: '📚', description: 'قراءة كلمات وجمل بسيطة بصوت عالٍ',                             ageMin: 5,  category: 'قراءة' },
  { id: 'emotion-volume',     labelAr: 'مقياس المشاعر',        icon: '📊', description: 'تعلّم التعبير عن شدة المشاعر',                                  ageMin: 5,  category: 'عاطفي' },
  { id: 'body-scan',          labelAr: 'مسح الجسم',            icon: '🧘', description: 'تمرين وعي الجسم والاسترخاء التدريجي',                          ageMin: 6,  category: 'استرخاء' },
  { id: 'word-recall',        labelAr: 'تذكّر الكلمات',        icon: '🧠', description: 'احفظ قائمة كلمات وأعد ترديدها',                                ageMin: 6,  category: 'ذاكرة' },
  { id: 'sequence-memory',    labelAr: 'تسلسل الذاكرة',        icon: '🔢', description: 'تذكّر تسلسل الألوان والأرقام وأعده بنفس الترتيب',              ageMin: 5,  category: 'ذاكرة' },
  { id: 'letter-match',       labelAr: 'مطابقة الحروف',        icon: '🔤', description: 'طابق الحرف مع شكله وصوته',                                      ageMin: 5,  category: 'قراءة' },
  { id: 'math-flash',         labelAr: 'ومضات الحساب',         icon: '➕', description: 'عمليات حسابية سريعة تناسب عمر الطفل',                           ageMin: 6,  category: 'حساب' },
  { id: 'pattern-match',      labelAr: 'مطابقة الأنماط',       icon: '🧩', description: 'اكتشف النمط وأكمله',                                            ageMin: 5,  category: 'تفكير' },
  { id: 'category-sort',      labelAr: 'تصنيف الفئات',         icon: '🗂️', description: 'رتّب الصور في فئاتها الصحيحة',                                  ageMin: 5,  category: 'تفكير' },
  { id: 'first-then',         labelAr: 'أولاً ثم',             icon: '➡️', description: 'لوحة «أولاً–ثم» لتسهيل الانتقال بين الأنشطة',                   ageMin: 4,  category: 'تنظيم' },
  { id: 'visual-schedule',    labelAr: 'الجدول المرئي',        icon: '📅', description: 'جدول مصوّر لخطوات اليوم',                                       ageMin: 4,  category: 'تنظيم' },
  { id: 'mood-meter',         labelAr: 'مقياس المزاج',         icon: '🌡️', description: 'حدّد مزاجك اليوم وتعرّف على درجته',                             ageMin: 5,  category: 'عاطفي' },
  { id: 'jumping-jacks',      labelAr: 'قفز النجمة',           icon: '⭐', description: 'تمرين هوائي ينشّط الجسم ويرفع التركيز',                          ageMin: 5,  category: 'حركي' },
  { id: 'mood-activation',    labelAr: 'نشاط ومزاج',           icon: '🌤️', description: 'قِس مزاجك، جرّب نشاطاً ممتعاً، ثم قِسه مجدداً — واكتشف ما يرفع مزاجك', ageMin: 5, category: 'عاطفي' },
]

export const HOME_EXERCISE_IDS = new Set(HOME_EXERCISES.map(e => e.id))
