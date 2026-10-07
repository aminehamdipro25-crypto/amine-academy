// Every outside copy of the lessons, kept in step from one place: the Notion
// database and the Google Calendar. Each never throws and records its own
// failure, so a lesson save never waits on — or fails because of — either.

import type { WorkLesson } from './worklog'
import { archiveLessonsInNotion, resyncFamilyInNotion, syncLessonsToNotion } from './worklog-notion-sync'
import { deleteLessonsFromGcal, resyncFamilyInGcal, syncLessonsToGcal } from './worklog-gcal-sync'

export async function mirrorLessons(lessons: WorkLesson[]): Promise<void> {
  await Promise.allSettled([syncLessonsToNotion(lessons), syncLessonsToGcal(lessons)])
}

export async function unmirrorLessons(lessonIds: string[]): Promise<void> {
  await Promise.allSettled([archiveLessonsInNotion(lessonIds), deleteLessonsFromGcal(lessonIds)])
}

export async function remirrorFamily(clientId: string): Promise<void> {
  await Promise.allSettled([resyncFamilyInNotion(clientId), resyncFamilyInGcal(clientId)])
}
