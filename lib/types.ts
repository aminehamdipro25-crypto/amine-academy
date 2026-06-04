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
  subscriptionPlan: 'basic' | 'standard' | 'premium'
  subscriptionExpiry: string | null
  childrenIds: string[]
  createdAt: string
  lastLoginAt: string | null
  reminderCount: number
  lastReminderAt: string | null
  notes: string                 // ملاحظات البروفيسور
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

// ── Session Tokens ────────────────────────────────────────────
export interface SessionPayload {
  id: string
  role: UserRole
  sessionId: string
  exp: number
}
