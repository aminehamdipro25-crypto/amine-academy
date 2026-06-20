// ============================================================
// AMINE ACADEMY — Core Type Definitions
// ============================================================

export type UserRole = 'admin' | 'parent' | 'student'
export type AgeGroup = '5-11' | '12-17' | '18-22'
export type Diagnosis = 'ADHD' | 'AUTISM' | 'ADHD+AUTISM' | 'OTHER'
export type SubscriptionStatus = 'pending' | 'active' | 'suspended' | 'cancelled' | 'expired'
export type ExerciseCategory = 'motor' | 'focus' | 'balance' | 'energy' | 'sensory' | 'social'
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show'
export type ReportType = 'weekly' | 'monthly' | 'session'

// ── Parent (Subscriber) ──────────────────────────────────────
export interface Parent {
  id: string                    // AA-xxx-xxx
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  phone: string
  country: string
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: 'basic' | 'standard' | 'premium' | 'session' | 'weekly' | 'monthly'
  subscriptionExpiry: string | null
  childrenIds: string[]
  createdAt: string
  lastLoginAt: string | null
  reminderCount: number
  lastReminderAt: string | null
  notes: string                 // ملاحظات الأستاذ
}

// ── Home Environment ─────────────────────────────────────────
export interface HomeEnvironment {
  spaceAvailable: 'small' | 'medium' | 'large'
  equipment: string[]           // ['ball', 'mat', 'rope', 'none', etc]
  noiseLevel: 'quiet' | 'moderate' | 'noisy'
  sensoryIssues: string[]       // ['bright-lights', 'loud-sounds', 'textures', 'smells']
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening'
  parentAvailability: 'always' | 'sometimes' | 'rarely'
  notes: string
}

// ── Student (Child) ──────────────────────────────────────────
export interface Student {
  id: string                    // AS-xxx-xxx
  parentId: string
  firstName: string
  lastName: string
  birthDate: string
  ageGroup: AgeGroup
  diagnosis: Diagnosis
  severityLevel: 1 | 2 | 3     // 1=خفيف, 2=متوسط, 3=شديد
  sensoryProfile: SensoryProfile
  currentProgramId: string | null
  achievements: Achievement[]
  totalPoints: number
  streak: number                // أيام متتالية
  createdAt: string
  notes: string
  homeEnvironment?: HomeEnvironment
}

export interface SensoryProfile {
  visualSensitivity: 'low' | 'medium' | 'high'
  audioSensitivity:  'low' | 'medium' | 'high'
  touchSensitivity:  'low' | 'medium' | 'high'
  preferredActivities: string[]
  avoidedActivities:   string[]
}

// ── Exercise ─────────────────────────────────────────────────
export interface Exercise {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  category: ExerciseCategory
  ageGroups: AgeGroup[]
  diagnoses: Diagnosis[]
  difficulty: ExerciseDifficulty
  durationMinutes: number
  points: number
  instructions: string[]
  instructionsAr: string[]
  videoUrl?: string
  thumbnailUrl?: string
  equipment: string[]
  contraindications: string[]
  psychologyObjective: string
  psychologyObjectiveAr: string
  createdAt: string
}

// ── Program ──────────────────────────────────────────────────
export interface Program {
  id: string
  studentId: string
  professorId: string
  title: string
  startDate: string
  endDate: string
  weeklySchedule: WeeklySchedule
  exerciseIds: string[]
  status: 'active' | 'completed' | 'paused'
  progressPercentage: number
  createdAt: string
}

export interface WeeklySchedule {
  monday:    string[]   // exercise IDs
  tuesday:   string[]
  wednesday: string[]
  thursday:  string[]
  friday:    string[]
  saturday:  string[]
  sunday:    string[]
}

// ── Appointment ───────────────────────────────────────────────
export interface Appointment {
  id: string
  parentId: string
  studentId: string
  date: string
  timeSlot: string              // "10:00-10:45"
  type: 'assessment' | 'followup' | 'emergency'
  status: AppointmentStatus
  meetingUrl?: string
  notes: string
  createdAt: string
}

// ── Progress Report ───────────────────────────────────────────
export interface ProgressReport {
  id: string
  studentId: string
  parentId: string
  type: ReportType
  periodStart: string
  periodEnd: string
  completedExercises: number
  totalExercises: number
  pointsEarned: number
  behaviorRatings: BehaviorRating[]
  professorNotes: string
  aiSummary: string
  createdAt: string
}

export interface BehaviorRating {
  metric: 'attention' | 'impulse_control' | 'social_interaction' | 'motor_coordination' | 'emotional_regulation'
  score: 1 | 2 | 3 | 4 | 5
  ratedBy: 'parent' | 'professor'
  date: string
}

// ── Achievement / Gamification ────────────────────────────────
export interface Achievement {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  icon: string
  points: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  unlockedAt: string
}

// ── Session Platform ──────────────────────────────────────────

export interface ExerciseResult {
  exerciseType:    string
  exerciseLabelAr: string
  score:           number   // 0-100
  accuracy:        number   // 0-100
  duration:        number   // seconds
  errors:          number
  metadata:        Record<string, unknown>
  completedAt:     string
}

export interface SessionObservations {
  attention:    1|2|3|4|5
  cooperation:  1|2|3|4|5
  energy:       1|2|3|4|5
  mood:         1|2|3|4|5
  anxiety:      1|2|3|4|5
}

export interface SessionLog {
  id:              string
  appointmentId:   string
  studentId:       string
  therapistNotes:  string
  observations:    SessionObservations
  exercises:       ExerciseResult[]
  durationSeconds: number
  highlights:      string[]
  createdAt:       string
}

export type AssessmentType = 'adhd' | 'autism' | 'learning-difficulties' | 'motor' | 'cognitive' | 'attention-domains'

export interface AssessmentAnswer {
  itemId:  string
  rating:  0|1|2|3
}

export interface AssessmentResult {
  id:            string
  studentId:     string
  type:          AssessmentType
  subtype?:      string
  domainScores:  Record<string, number>
  totalScore:    number
  severity:      'none' | 'mild' | 'moderate' | 'severe'
  recommendations: string[]
  answers:       AssessmentAnswer[]
  completedAt:   string
  createdAt:     string
}

export interface LearningDifficultyProfile {
  id:         string
  studentId:  string
  dyslexia:   { severity: 'none'|'mild'|'moderate'|'severe'; indicators: string[] }
  dyscalculia:{ severity: 'none'|'mild'|'moderate'|'severe'; indicators: string[] }
  dysgraphia: { severity: 'none'|'mild'|'moderate'|'severe'; indicators: string[] }
  workingMemory: { severity: 'none'|'mild'|'moderate'|'severe'; indicators: string[] }
  processingSpeed: { severity: 'none'|'mild'|'moderate'|'severe'; indicators: string[] }
  recommendations: string[]
  updatedAt:  string
  createdAt:  string
}

// ── Session Tokens ────────────────────────────────────────────
export interface SessionPayload {
  id: string
  role: UserRole
  sessionId: string
  exp: number
}

// ── Staff (multi-therapist accounts, distinct from the owner's
// master ADMIN_PASSWORD) ────────────────────────────────────────
export interface Staff {
  id: string
  email: string
  passwordHash: string
  name: string
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

// ── Messages ──────────────────────────────────────────────────
export interface Message {
  id: string
  threadId: string      // parentId
  from: 'admin' | 'parent'
  senderName: string
  content: string
  read: boolean
  createdAt: string
}

// ── Payments ──────────────────────────────────────────────────
export type PaymentMethod = 'fawran' | 'bank_transfer_qa' | 'bank_transfer_tn' | 'whatsapp'
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'expired'
export interface PendingPayment {
  id: string
  parentId?: string   // if logged-in parent
  guestName: string
  guestEmail: string
  guestPhone: string
  plan: 'basic' | 'standard' | 'premium' | 'session' | 'weekly' | 'monthly'
  currency: 'QAR' | 'TND'
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  referenceCode: string   // e.g. "AA-2024-XXXX"
  adminNotes?: string
  createdAt: string
  confirmedAt?: string
}

// ── Assessment Profile (consolidated diagnostic record) ───────
export type DifficultyLevel = 'none' | 'mild' | 'moderate' | 'severe'

export interface StudentAssessmentProfile {
  studentId:    string
  updatedAt:    string

  diagnosedDifficulties: {
    attentionDeficit:  DifficultyLevel
    impulsivity:       DifficultyLevel
    workingMemory:     DifficultyLevel
    processingSpeed:   DifficultyLevel
    dyslexia:          DifficultyLevel
    dyscalculia:       DifficultyLevel
    socialCognition:   DifficultyLevel
    motorCoordination: DifficultyLevel
  }

  recommendedGames:     string[]
  contraindicatedGames: string[]
  defaultDifficulty:    1 | 2 | 3
  clinicalNotes:        string
  lastAssessmentId:     string | null
}

// ── Game Results (per-game longitudinal tracking) ─────────────
export interface GameResult {
  id:              string
  gameId:          string
  gameLabelAr:     string
  sessionId:       string   // appointmentId
  studentId:       string
  playedAt:        string   // ISO
  score:           number   // 0-100
  accuracy:        number   // 0-100
  reactionTimeMs:  number   // avg reaction time
  level:           number   // difficulty level used
  durationSeconds: number
  completed:       boolean
}

// ── Weekly Progress snapshot ───────────────────────────────────
export interface WeeklyProgress {
  studentId:    string
  weekStart:    string   // ISO date of Monday
  gamesPlayed:  number
  totalMinutes: number
  avgAccuracy:  number   // 0-100
  streakDays:   number
  sessionCount: number
  domainScores: Partial<Record<string, number>>  // domain -> avg score 0-100
  topGames:     string[]
  createdAt:    string
}
