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
// ============================================================

import { redis } from './redis'
import { generateId } from './auth'
import type { Parent, Student, Exercise, Program, Appointment, ProgressReport } from './types'

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
  // Add to parent's childrenIds
  await updateParent(data.parentId, {})  // trigger refresh
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
