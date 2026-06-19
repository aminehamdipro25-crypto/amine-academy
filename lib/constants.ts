export const DIAG_LABELS: Record<string, string> = {
  ADHD: 'ADHD', AUTISM: 'توحد', 'ADHD+AUTISM': 'ADHD+توحد', OTHER: 'أخرى',
}

export const SEVERITY_LABELS: Record<number, string> = {
  1: 'خفيف', 2: 'متوسط', 3: 'شديد',
}

export const DIFFICULTY_LEVEL_LABELS: Record<string, string> = {
  none: 'لا يوجد', mild: 'خفيف', moderate: 'متوسط', severe: 'شديد',
}

export const GAME_LABELS_AR: Record<string, string> = {
  'memory-cards':    'مطابقة البطاقات',
  'sequence-memory': 'تذكر التسلسل',
  'n-back':          'ذاكرة N-Back',
  'word-recall':     'تذكر الكلمات',
  'letter-match':    'مطابقة الحروف',
  'breathing':       'تمارين التنفس',
  'tap-target':      'التناسق الحركي',
  'simon-says':      'سايمون يقول',
  'reaction-game':   'سرعة رد الفعل',
  'stroop-test':     'ستروب — كبح الاستجابة',
  'stop-signal':     'توقف أو اكمل',
  'go-no-go':        'اضغط / لا تضغط',
  'emotion-cards':   'التعرف على المشاعر',
}

export const GAME_CATEGORIES_AR: Record<string, string> = {
  'memory-cards':    'ذاكرة',
  'sequence-memory': 'ذاكرة',
  'n-back':          'ذاكرة',
  'word-recall':     'ذاكرة',
  'letter-match':    'صعوبات التعلم',
  'breathing':       'تنفس',
  'tap-target':      'حركي',
  'simon-says':      'إدراكي',
  'reaction-game':   'حركي',
  'stroop-test':     'انتباه',
  'stop-signal':     'اندفاعية',
  'go-no-go':        'اندفاعية',
  'emotion-cards':   'اجتماعي',
}
