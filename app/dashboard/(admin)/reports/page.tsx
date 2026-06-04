import { getAllParents, getStudentsByParent, getStudentReports } from '@/lib/db'
import { FileText, TrendingUp, Star, AlertCircle, User, Brain } from 'lucide-react'
import type { ProgressReport, Student } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const METRIC_LABELS: Record<string, string> = {
  attention:           'الانتباه والتركيز',
  impulse_control:     'كبح الاندفاعية',
  social_interaction:  'التفاعل الاجتماعي',
  motor_coordination:  'التنسيق الحركي',
  emotional_regulation:'تنظيم المشاعر',
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = (score / 5) * 100
  const color = score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold text-gray-700 ltr-num">{score}/5</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function ReportsPage() {
  let allReports: Array<{ report: ProgressReport; student: Student; parentName: string }> = []
  let error = false

  try {
    const parents = await getAllParents()
    for (const parent of parents) {
      const students = await getStudentsByParent(parent.id)
      for (const student of students) {
        const reports = await getStudentReports(student.id)
        for (const r of reports) {
          allReports.push({
            report: r,
            student,
            parentName: `${parent.firstName} ${parent.lastName}`,
          })
        }
      }
    }
    allReports.sort((a, b) => new Date(b.report.createdAt).getTime() - new Date(a.report.createdAt).getTime())
  } catch {
    error = true
  }

  const TYPE_LABEL: Record<string, string> = {
    weekly:  'أسبوعي',
    monthly: 'شهري',
    session: 'جلسة',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">تقارير التقدم</h1>
        <p className="text-gray-500 text-sm mt-1">تقارير التطور الفردي لكل طفل</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-amber-800 text-sm font-medium">تعذّر الاتصال بقاعدة البيانات</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 ltr-num">{allReports.length}</div>
            <div className="text-gray-500 text-xs">إجمالي التقارير</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 ltr-num">
              {allReports.filter(r => r.report.type === 'monthly').length}
            </div>
            <div className="text-gray-500 text-xs">تقارير شهرية</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 ltr-num">
              {new Set(allReports.map(r => r.student.id)).size}
            </div>
            <div className="text-gray-500 text-xs">أطفال لديهم تقارير</div>
          </div>
        </div>
      </div>

      {/* Reports list */}
      {allReports.length === 0 && !error ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-gray-400 font-bold">لا توجد تقارير بعد</p>
          <p className="text-gray-300 text-sm mt-1 max-w-sm mx-auto">
            ستظهر تقارير التقدم هنا بعد إنشاء أولى الجلسات والتقييمات
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allReports.map(({ report, student, parentName }) => {
            const completionPct = report.totalExercises > 0
              ? Math.round((report.completedExercises / report.totalExercises) * 100)
              : 0
            const avgRating = report.behaviorRatings?.length > 0
              ? (report.behaviorRatings.reduce((s, r) => s + r.score, 0) / report.behaviorRatings.length).toFixed(1)
              : null

            return (
              <div key={report.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Report header */}
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-sm">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-gray-400 text-xs">{parentName} • {student.diagnosis}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2.5 py-1 rounded-full">
                      {TYPE_LABEL[report.type] ?? report.type}
                    </span>
                    <span className="text-xs text-gray-400 ltr-num">
                      {new Date(report.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Progress */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">التمارين المنجزة</p>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-3xl font-black text-gray-900 ltr-num">{completionPct}%</span>
                      <span className="text-gray-400 text-sm mb-1 ltr-num">{report.completedExercises}/{report.totalExercises}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${completionPct >= 80 ? 'bg-green-500' : completionPct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-yellow-400" />
                      <span className="font-black text-gray-900 text-sm ltr-num">{report.pointsEarned}</span>
                      <span className="text-gray-400 text-xs">نقطة مكتسبة</span>
                    </div>
                    {avgRating && (
                      <div className="mt-2 text-xs text-gray-500 ltr-num">
                        متوسط التقييم السلوكي: <span className="font-bold text-brand-600">{avgRating}/5</span>
                      </div>
                    )}
                  </div>

                  {/* Behavior ratings */}
                  {report.behaviorRatings?.length > 0 && (
                    <div className="lg:col-span-2">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-3">التقييم السلوكي</p>
                      <div className="space-y-2.5">
                        {report.behaviorRatings.map((rating, i) => (
                          <ScoreBar
                            key={i}
                            score={rating.score}
                            label={METRIC_LABELS[rating.metric] ?? rating.metric}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {report.professorNotes && (
                  <div className="px-6 pb-5">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-500 mb-1">ملاحظات الأستاذ</p>
                      <p className="text-gray-700 text-sm leading-relaxed">{report.professorNotes}</p>
                    </div>
                  </div>
                )}

                {report.aiSummary && (
                  <div className="px-6 pb-5">
                    <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
                      <p className="text-xs font-bold text-brand-600 mb-1 flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        الملخص الذكي
                      </p>
                      <p className="text-brand-800 text-sm leading-relaxed">{report.aiSummary}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
