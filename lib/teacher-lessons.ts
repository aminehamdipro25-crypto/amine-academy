import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis'

// ── Amine Languages — a teacher's own lesson library ─────────────────────────
// Teachers are free to teach with their OWN material, not only the built-in CEFR
// curriculum. Each keeps a private library of lessons/plans.
// Redis: teacher_lesson:<id> → JSON ; teacher_lessons:<staffId> → [id]

export interface TeacherLesson {
  id: string
  teacherId: string
  title: string
  level: string       // CEFR level or 'all'
  content: string     // plan / notes
  resources: string   // links / references (free text, one per line)
  createdAt: string
}

const KEY = (id: string) => `teacher_lesson:${id}`
const INDEX = (staffId: string) => `teacher_lessons:${staffId}`

export async function createTeacherLesson(data: Omit<TeacherLesson, 'id' | 'createdAt'>): Promise<TeacherLesson> {
  const lesson: TeacherLesson = { ...data, id: `tl_${randomUUID()}`, createdAt: new Date().toISOString() }
  await redis.set(KEY(lesson.id), lesson)
  await redis.lpush(INDEX(data.teacherId), lesson.id)
  return lesson
}

export async function getTeacherLessons(staffId: string): Promise<TeacherLesson[]> {
  const ids = await redis.lrange(INDEX(staffId), 0, -1)
  if (!ids.length) return []
  const rows = await redis.mget<TeacherLesson>(ids.map(KEY))
  return (rows.filter(Boolean) as TeacherLesson[]).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function getTeacherLesson(id: string): Promise<TeacherLesson | null> {
  return redis.get<TeacherLesson>(KEY(id))
}

export async function deleteTeacherLesson(id: string, staffId: string): Promise<void> {
  await redis.pipeline([
    ['DEL', KEY(id)],
    ['LREM', INDEX(staffId), '0', id],
  ])
}
