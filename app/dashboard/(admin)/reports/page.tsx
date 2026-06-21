import { getAllParents, getStudentsByParent, getStudentReports } from '@/lib/db'
import ReportsView from './ReportsView'
import type { ProgressReport, Student } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function ReportsPage() {
  let allReports: Array<{ report: ProgressReport; student: Student; parentName: string; parentIdx: number }> = []
  let error = false

  try {
    const parents = await getAllParents()
    for (let pi = 0; pi < parents.length; pi++) {
      const parent = parents[pi]
      const students = await getStudentsByParent(parent.id)
      for (const student of students) {
        const reports = await getStudentReports(student.id)
        for (const r of reports) {
          allReports.push({ report: r, student, parentName: `${parent.firstName} ${parent.lastName}`, parentIdx: pi })
        }
      }
    }
    allReports.sort((a, b) => new Date(b.report.createdAt).getTime() - new Date(a.report.createdAt).getTime())
  } catch {
    error = true
  }

  return <ReportsView allReports={allReports} error={error} />
}
