import type { StudentAssessmentProfile } from './types'

type DifficultDomain = keyof StudentAssessmentProfile['diagnosedDifficulties']

export const GAME_TARGETS: Record<string, DifficultDomain[]> = {
  'memory-cards':    ['workingMemory', 'attentionDeficit'],
  'sequence-memory': ['workingMemory', 'processingSpeed'],
  'n-back':          ['workingMemory', 'attentionDeficit'],
  'word-recall':     ['workingMemory', 'dyslexia'],
  'letter-match':    ['dyslexia', 'dyscalculia'],
  'breathing':       ['impulsivity'],
  'tap-target':      ['motorCoordination', 'processingSpeed'],
  'simon-says':      ['socialCognition', 'attentionDeficit'],
  'reaction-game':   ['processingSpeed', 'attentionDeficit'],
  'stroop-test':     ['impulsivity', 'attentionDeficit'],
  'stop-signal':     ['impulsivity'],
  'emotion-cards':   ['socialCognition'],
}

const SEVERITY_SCORE: Record<string, number> = { none: 0, mild: 1, moderate: 3, severe: 5 }

export function rankGamesForStudent(profile: StudentAssessmentProfile): string[] {
  return Object.keys(GAME_TARGETS).sort((a, b) => {
    const score = (id: string) =>
      GAME_TARGETS[id].reduce((s, d) =>
        s + (SEVERITY_SCORE[profile.diagnosedDifficulties[d] ?? 'none'] ?? 0), 0)
    return score(b) - score(a)
  })
}

export function getTopGames(profile: StudentAssessmentProfile, n = 3): string[] {
  return rankGamesForStudent(profile).slice(0, n)
}

export const DIFFICULTY_LABELS_AR: Record<DifficultDomain, string> = {
  attentionDeficit:  'الانتباه',
  impulsivity:       'الاندفاعية',
  workingMemory:     'الذاكرة',
  processingSpeed:   'سرعة المعالجة',
  dyslexia:          'عسر القراءة',
  dyscalculia:       'عسر الحساب',
  socialCognition:   'التواصل الاجتماعي',
  motorCoordination: 'التناسق الحركي',
}
