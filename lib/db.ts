// ============================================================
// AMINE ACADEMY — Database Layer (Upstash Redis)
// Key Scheme:
//   parent:{id}              → Parent JSON
//   parents:index            → [parent IDs] (LPUSH/LRANGE)
//   parent:email:{email}     → parent ID
//   student:{id}             → Student JSON
//   students:parent:{pid}    → [student IDs]
//   exercise:{id}            → Exercise JSON
//   exercises:index          → [exercise IDs]
//   program:{id}             → Program JSON
//   program:student:{sid}    → current program ID
//   appointment:{id}         → Appointment JSON
//   appointments:parent:{pid}→ [appointment IDs]
//   report:{id}              → ProgressReport JSON
//   reports:student:{sid}    → [report IDs]
//   sess:{id}                → sessionId
//   admin_sess:{token}       → '1'
//   rl:{key}                 → rate limit counter
//   client_last:{id}         → timestamp (TTL 10min)
//   activation:{email}       → code (TTL 24h)
//
//   Exercise completion persistence:
//   completed:{studentId}:{YYYY-MM-DD} → Set of exercise IDs completed that day (TTL 90 days)
//   exercises:count:{studentId}        → Total exercises ever completed (INCR counter)
// ============================================================

import { redis } from './redis'
import { generateId } from './auth'
import type { Parent, Student, Exercise, Program, Appointment, ProgressReport, PendingPayment, Message, Achievement } from './types'

// ── Parents ───────────────────────────────────────────────────

export async function createParent(data: Omit<Parent, 'id' | 'createdAt'>): Promise<Parent> {
  const id = generateId('AA')
  const parent: Parent = { ...data, id, createdAt: new Date().toISOString() }
  await redis.pipeline([
    ['SET', `parent:${id}`, JSON.stringify(parent)],
    ['LPUSH', 'parents:index', id],
    ['SET', `parent:email:${data.email.toLowerCase()}`, id, 'NX'],
  ])
  return parent
}

export async function getParent(id: string): Promise<Parent | null> {
  return redis.get<Parent>(`parent:${id}`)
}

export async function getParentByEmail(email: string): Promise<Parent | null> {
  const id = await redis.get<string>(`parent:email:${email.toLowerCase()}`)
  if (!id) return null
  return getParent(id)
}

export async function updateParent(id: string, updates: Partial<Parent>): Promise<void> {
  const current = await getParent(id)
  if (!current) throw new Error('Parent not found')
  await redis.set(`parent:${id}`, { ...current, ...updates })
}

export async function getAllParents(): Promise<Parent[]> {
  const ids = await redis.lrange('parents:index', 0, -1)
  const parents = await Promise.all(ids.map(id => getParent(id)))
  return parents.filter(Boolean) as Parent[]
}

// ── Students ──────────────────────────────────────────────────

export async function createStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const id = generateId('AS')
  const student: Student = { ...data, id, createdAt: new Date().toISOString() }
  await redis.pipeline([
    ['SET', `student:${id}`, JSON.stringify(student)],
    ['LPUSH', `students:parent:${data.parentId}`, id],
  ])
  return student
}

export async function getStudent(id: string): Promise<Student | null> {
  return redis.get<Student>(`student:${id}`)
}

export async function getStudentsByParent(parentId: string): Promise<Student[]> {
  const ids = await redis.lrange(`students:parent:${parentId}`, 0, -1)
  const students = await Promise.all(ids.map(id => getStudent(id)))
  return students.filter(Boolean) as Student[]
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<void> {
  const current = await getStudent(id)
  if (!current) throw new Error('Student not found')
  await redis.set(`student:${id}`, { ...current, ...updates })
}

// ── Exercises ─────────────────────────────────────────────────

export async function createExercise(data: Omit<Exercise, 'id' | 'createdAt'>): Promise<Exercise> {
  const id = generateId('AE')
  const exercise: Exercise = { ...data, id, createdAt: new Date().toISOString() }
  await redis.pipeline([
    ['SET', `exercise:${id}`, JSON.stringify(exercise)],
    ['LPUSH', 'exercises:index', id],
  ])
  return exercise
}

export async function getExercise(id: string): Promise<Exercise | null> {
  return redis.get<Exercise>(`exercise:${id}`)
}

export async function getAllExercises(): Promise<Exercise[]> {
  const ids = await redis.lrange('exercises:index', 0, -1)
  const exercises = await Promise.all(ids.map(id => getExercise(id)))
  return exercises.filter(Boolean) as Exercise[]
}

// ── Programs ──────────────────────────────────────────────────

export async function createProgram(data: Omit<Program, 'id'>): Promise<Program> {
  const id = generateId('AP')
  const program: Program = { ...data, id }
  await redis.pipeline([
    ['SET', `program:${id}`, JSON.stringify(program)],
    ['SET', `program:student:${data.studentId}`, id],
  ])
  await updateStudent(data.studentId, { currentProgramId: id })
  return program
}

export async function getProgram(id: string): Promise<Program | null> {
  return redis.get<Program>(`program:${id}`)
}

export async function getStudentProgram(studentId: string): Promise<Program | null> {
  const id = await redis.get<string>(`program:student:${studentId}`)
  if (!id) return null
  return getProgram(id)
}

// ── Appointments ──────────────────────────────────────────────

export async function createAppointment(data: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
  const id = generateId('AP')
  const appointment: Appointment = { ...data, id, createdAt: new Date().toISOString() }
  await redis.pipeline([
    ['SET', `appointment:${id}`, JSON.stringify(appointment)],
    ['LPUSH', `appointments:parent:${data.parentId}`, id],
    ['LPUSH', 'appointments:index', id],
  ])
  return appointment
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  return redis.get<Appointment>(`appointment:${id}`)
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<void> {
  const current = await getAppointment(id)
  if (!current) throw new Error('Appointment not found')
  await redis.set(`appointment:${id}`, { ...current, ...updates })
}

export async function getParentAppointments(parentId: string): Promise<Appointment[]> {
  const ids = await redis.lrange(`appointments:parent:${parentId}`, 0, 20)
  const appts = await Promise.all(ids.map(id => getAppointment(id)))
  return appts.filter(Boolean) as Appointment[]
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const ids = await redis.lrange('appointments:index', 0, 100)
  const appts = await Promise.all(ids.map(id => getAppointment(id)))
  return appts.filter(Boolean) as Appointment[]
}

// ── Progress Reports ──────────────────────────────────────────

export async function createReport(data: Omit<ProgressReport, 'id' | 'createdAt'>): Promise<ProgressReport> {
  const id = generateId('AR' as never)
  const report: ProgressReport = { ...data, id: `AR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString() }
  await redis.pipeline([
    ['SET', `report:${report.id}`, JSON.stringify(report)],
    ['LPUSH', `reports:student:${data.studentId}`, report.id],
  ])
  return report
}

export async function getStudentReports(studentId: string): Promise<ProgressReport[]> {
  const ids = await redis.lrange(`reports:student:${studentId}`, 0, 20)
  const reports = await Promise.all(ids.map(id => redis.get<ProgressReport>(`report:${id}`)))
  return reports.filter(Boolean) as ProgressReport[]
}

// ── Activation Codes ──────────────────────────────────────────

export async function createActivationCode(email: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  await redis.set(`activation:${email}`, code, { ex: 86400 })
  return code
}

export async function verifyActivationCode(email: string, code: string): Promise<boolean> {
  const stored = await redis.get<string>(`activation:${email}`)
  return stored === code
}

export async function deleteActivationCode(email: string): Promise<void> {
  await redis.del(`activation:${email}`)
}

// ── Password Reset Tokens ─────────────────────────────────────

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = require('crypto').randomBytes(32).toString('hex')
  await redis.set(`pwd_reset:${email}`, token, { ex: 3600 }) // 1 hour
  return token
}

export async function verifyPasswordResetToken(email: string, token: string): Promise<boolean> {
  const stored = await redis.get<string>(`pwd_reset:${email}`)
  if (!stored) return false
  return String(stored).trim() === String(token).trim()
}

export async function deletePasswordResetToken(email: string): Promise<void> {
  await redis.del(`pwd_reset:${email}`)
}

// ── Pending Payments ──────────────────────────────────────────
//   payment:{id}           → PendingPayment JSON (TTL 30d)
//   payments:index         → [payment IDs]
//   payments:parent:{pid}  → [payment IDs] for logged-in parents

export async function createPendingPayment(
  data: Omit<PendingPayment, 'id' | 'referenceCode' | 'createdAt'>
): Promise<PendingPayment> {
  const id = generateId('AP')
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000).toString()
  const referenceCode = `AA-${year}-${rand}`
  const payment: PendingPayment = {
    ...data,
    id,
    referenceCode,
    createdAt: new Date().toISOString(),
  }
  const TTL_30D = 30 * 24 * 3600
  const cmds: [string, ...string[]][] = [
    ['SET', `payment:${id}`, JSON.stringify(payment), 'EX', String(TTL_30D)],
    ['LPUSH', 'payments:index', id],
  ]
  if (data.parentId) {
    cmds.push(['LPUSH', `payments:parent:${data.parentId}`, id])
  }
  await redis.pipeline(cmds)
  return payment
}

export async function getPendingPayment(id: string): Promise<PendingPayment | null> {
  return redis.get<PendingPayment>(`payment:${id}`)
}

export async function updatePendingPayment(
  id: string,
  updates: Partial<PendingPayment>
): Promise<void> {
  const current = await getPendingPayment(id)
  if (!current) throw new Error('Payment not found')
  await redis.set(`payment:${id}`, { ...current, ...updates })
}

export async function getAllPendingPayments(): Promise<PendingPayment[]> {
  const ids = await redis.lrange('payments:index', 0, 100)
  const payments = await Promise.all(ids.map(id => getPendingPayment(id)))
  return payments.filter(Boolean) as PendingPayment[]
}

// ── Exercise Completion & Achievements ────────────────────────

const TTL_90D = 90 * 24 * 3600

interface AchievementDef {
  id: string
  nameAr: string
  icon: string
  /** Format: 'exercises:N' | 'streak:N' | 'points:N' */
  threshold: string
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'first_exercise', nameAr: 'البداية الرائعة',   icon: '🌟', threshold: 'exercises:1'   },
  { id: 'exercises_10',   nameAr: 'عشرة تمارين',       icon: '💪', threshold: 'exercises:10'  },
  { id: 'exercises_50',   nameAr: 'خمسون تمريناً',     icon: '🏆', threshold: 'exercises:50'  },
  { id: 'streak_3',       nameAr: '3 أيام متتالية',     icon: '🔥', threshold: 'streak:3'      },
  { id: 'streak_7',       nameAr: 'أسبوع كامل',         icon: '⚡', threshold: 'streak:7'      },
  { id: 'streak_30',      nameAr: 'شهر كامل',           icon: '👑', threshold: 'streak:30'     },
  { id: 'points_100',     nameAr: '100 نقطة',           icon: '💯', threshold: 'points:100'    },
  { id: 'points_500',     nameAr: '500 نقطة',           icon: '🎯', threshold: 'points:500'    },
  { id: 'points_1000',    nameAr: '1000 نقطة',          icon: '🚀', threshold: 'points:1000'   },
]

function checkNewAchievements(
  existingAchievements: Achievement[],
  totalPoints: number,
  streak: number,
  exerciseCount: number,
): Achievement[] {
  const existingIds = new Set(existingAchievements.map(a => a.id))
  const unlocked: Achievement[] = []

  for (const def of ACHIEVEMENT_DEFS) {
    if (existingIds.has(def.id)) continue
    const [type, valueStr] = def.threshold.split(':')
    const threshold = parseInt(valueStr, 10)
    let earned = false
    if (type === 'exercises' && exerciseCount >= threshold) earned = true
    if (type === 'streak'    && streak >= threshold)        earned = true
    if (type === 'points'    && totalPoints >= threshold)   earned = true
    if (earned) {
      const tier: Achievement['tier'] =
        threshold >= 1000 || def.id === 'streak_30' ? 'gold'
        : threshold >= 500  || def.id === 'streak_7'  ? 'silver'
        : 'bronze'
      unlocked.push({
        id: def.id,
        title: def.nameAr,
        titleAr: def.nameAr,
        description: def.nameAr,
        descriptionAr: def.nameAr,
        icon: def.icon,
        points: 0,
        tier,
        unlockedAt: new Date().toISOString(),
      })
    }
  }
  return unlocked
}

/**
 * Mark an exercise as completed for today.
 * Uses Redis Set keyed by date (TTL 90 days) to prevent double-counting.
 * Returns { alreadyDone, pointsEarned, newTotalPoints, newStreak, newAchievements }
 */
export async function completeExercise(
  studentId: string,
  exerciseId: string,
  pointsToAdd: number,
): Promise<{
  alreadyDone: boolean
  pointsEarned: number
  newTotalPoints: number
  newStreak: number
  newAchievements: string[]
}> {
  const today    = new Date().toISOString().slice(0, 10)
  const todayKey = `completed:${studentId}:${today}`

  // Check for duplicate completion
  const alreadyDone = (await redis.sismember(todayKey, exerciseId)) === 1
  if (alreadyDone) {
    const student = await getStudent(studentId)
    return {
      alreadyDone: true,
      pointsEarned: 0,
      newTotalPoints: student?.totalPoints ?? 0,
      newStreak: student?.streak ?? 0,
      newAchievements: [],
    }
  }

  // Mark exercise as done for today
  await redis.sadd(todayKey, exerciseId)
  await redis.expire(todayKey, TTL_90D)

  // Increment all-time exercise counter
  const exerciseCount = await redis.incr(`exercises:count:${studentId}`)

  // Load student
  const student = await getStudent(studentId)
  if (!student) throw new Error('Student not found')

  // Calculate streak — if yesterday's set has any members the streak continues
  const yesterday    = new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10)
  const yesterdayKey = `completed:${studentId}:${yesterday}`
  const hadYesterday = (await redis.smembers(yesterdayKey)).length > 0
  const newStreak    = hadYesterday ? student.streak + 1 : 1

  // Add points
  const newTotalPoints = student.totalPoints + pointsToAdd

  // Check achievements
  const newlyUnlocked = checkNewAchievements(
    student.achievements,
    newTotalPoints,
    newStreak,
    exerciseCount,
  )
  const updatedAchievements = [...student.achievements, ...newlyUnlocked]

  // Persist updated student
  await updateStudent(studentId, {
    totalPoints: newTotalPoints,
    streak: newStreak,
    achievements: updatedAchievements,
  })

  return {
    alreadyDone: false,
    pointsEarned: pointsToAdd,
    newTotalPoints,
    newStreak,
    newAchievements: newlyUnlocked.map(a => a.titleAr),
  }
}

// ── Delete Parent (+ children, appointments index cleanup) ────

export async function deleteParentFull(parentId: string): Promise<void> {
  const parent = await getParent(parentId)
  if (!parent) return

  const studentIds = await redis.lrange(`students:parent:${parentId}`, 0, -1)
  const appointmentIds = await redis.lrange(`appointments:parent:${parentId}`, 0, -1)
  const reportIds: string[] = []

  for (const sid of studentIds) {
    const rids = await redis.lrange(`reports:student:${sid}`, 0, -1)
    reportIds.push(...rids)
  }

  const cmds: [string, ...string[]][] = [
    ['DEL', `parent:${parentId}`],
    ['DEL', `parent:email:${parent.email}`],
    ['DEL', `students:parent:${parentId}`],
    ['DEL', `appointments:parent:${parentId}`],
    ['LREM', 'parents:index', '0', parentId],
  ]

  for (const sid of studentIds) {
    cmds.push(['DEL', `student:${sid}`])
    cmds.push(['DEL', `reports:student:${sid}`])
    cmds.push(['DEL', `program:student:${sid}`])
  }
  for (const aid of appointmentIds) {
    cmds.push(['DEL', `appointment:${aid}`])
    cmds.push(['LREM', 'appointments:index', '0', aid])
  }
  for (const rid of reportIds) {
    cmds.push(['DEL', `report:${rid}`])
  }

  await redis.pipeline(cmds)
}

// ── Messages ──────────────────────────────────────────────────
// Key scheme:
//   message:{id}                        → Message JSON (TTL 90 days)
//   messages:thread:{parentId}          → LPUSH list of message IDs (latest first)
//   messages:unread:parent:{parentId}   → counter (parent hasn't read admin messages)
//   messages:unread:admin:{parentId}    → counter (admin hasn't read parent messages)
//   messages:threads:index              → LPUSH parentId (when first message is sent)

const MSG_TTL = 90 * 24 * 3600 // 90 days in seconds

export async function sendMessage(
  data: Omit<Message, 'id' | 'createdAt'>
): Promise<Message> {
  const id = `MSG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const message: Message = { ...data, id, createdAt: new Date().toISOString() }

  // Check if this is first message in thread (add to index)
  const existingThread = await redis.lrange(`messages:thread:${data.threadId}`, 0, 0)
  const isFirstMessage = existingThread.length === 0

  const cmds: unknown[][] = [
    ['SET', `message:${id}`, JSON.stringify(message), 'EX', String(MSG_TTL)],
    ['LPUSH', `messages:thread:${data.threadId}`, id],
    ['EXPIRE', `messages:thread:${data.threadId}`, String(MSG_TTL)],
  ]

  // Increment unread counter for the recipient
  if (data.from === 'admin') {
    // Parent hasn't read this admin message
    cmds.push(['INCR', `messages:unread:parent:${data.threadId}`])
    cmds.push(['EXPIRE', `messages:unread:parent:${data.threadId}`, String(MSG_TTL)])
  } else {
    // Admin hasn't read this parent message
    cmds.push(['INCR', `messages:unread:admin:${data.threadId}`])
    cmds.push(['EXPIRE', `messages:unread:admin:${data.threadId}`, String(MSG_TTL)])
  }

  if (isFirstMessage) {
    cmds.push(['LPUSH', 'messages:threads:index', data.threadId])
  }

  await redis.pipeline(cmds)
  return message
}

export async function getThreadMessages(parentId: string, limit = 50): Promise<Message[]> {
  const ids = await redis.lrange(`messages:thread:${parentId}`, 0, limit - 1)
  if (ids.length === 0) return []
  const messages = await Promise.all(
    ids.map(id => redis.get<Message>(`message:${id}`))
  )
  // Filter nulls and reverse so oldest is first
  return (messages.filter(Boolean) as Message[]).reverse()
}

export async function markThreadRead(parentId: string, viewer: 'admin' | 'parent'): Promise<void> {
  await redis.del(`messages:unread:${viewer}:${parentId}`)
}

export async function getUnreadCount(parentId: string, viewer: 'admin' | 'parent'): Promise<number> {
  const val = await redis.get<string>(`messages:unread:${viewer}:${parentId}`)
  if (val === null || val === undefined) return 0
  const n = parseInt(String(val), 10)
  return isNaN(n) ? 0 : n
}

export async function getAllMessageThreads(): Promise<{
  parentId: string
  lastMessage: Message
  unreadForAdmin: number
}[]> {
  // Get all parentIds that have threads
  const parentIds = await redis.lrange('messages:threads:index', 0, 99)
  // Deduplicate (same parentId could be pushed multiple times in edge cases)
  const unique = Array.from(new Set(parentIds))

  const results = await Promise.all(
    unique.map(async (parentId) => {
      const ids = await redis.lrange(`messages:thread:${parentId}`, 0, 0)
      if (ids.length === 0) return null
      const lastMessage = await redis.get<Message>(`message:${ids[0]}`)
      if (!lastMessage) return null
      const unreadForAdmin = await getUnreadCount(parentId, 'admin')
      return { parentId, lastMessage, unreadForAdmin }
    })
  )

  return (results.filter(Boolean) as { parentId: string; lastMessage: Message; unreadForAdmin: number }[])
    .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime())
}
