'use client'
import { useEffect, useState } from 'react'
import { FileText, ChevronDown, ChevronUp, Brain } from 'lucide-react'
import type { Student, ProgressReport } from '@/lib/types'

interface ChildReports { child: Student; reports: ProgressReport[] }

const REPORT_TYPE_LABELS: Record<string, string> = {
  weekly: 'تقرير أسبوعي',
  monthly: 'تقرير شهري',
  session: 'تقرير جلسة',
}

const METRIC_LABELS: Record<string, string> = {
  attention: 'الانتباه والتركيز',
  impulse_control: 'كبح الاندفاعية',
  social_interaction: 'المهارات الاجتماعية',
  motor_coordination: 'التنسيق الحركي',
  emotional_regulation: 'الضبط الانفعالي',
}

function ReportCard({ report, child }: { report: ProgressReport; child: Student }) {
  const [open, setOpen] = useState(false)
  const completion = report.totalExercises > 0
    ? Math.round((report.completedExercises / report.totalExercises) * 100)
    : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-right hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-brand-600" />
          </div>
          <div className="text-right">
            <div className="font-black text-gray-900 text-sm">{REPORT_TYPE_LABELS[report.type] || report.type}</div>
            <div className="text-gray-400 text-xs ltr-num mt-0.5">
              {new Date(report.periodStart).toLocaleDateString('ar-SA')} — {new Date(report.periodEnd).toLocaleDateString('ar-SA')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="font-black text-brand-700 ltr-num">{report.pointsEarned}</div>
            <div className="text-gray-400 text-xs">نقطة</div>
          </div>
          <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-xs font-black ${
            completion >= 80 ? 'border-green-400 text-green-700' :
            completion >= 50 ? 'border-amber-400 text-amber-700' :
            'border-red-300 text-red-600'
          }`}>
            <span className="ltr-num">{completion}%</span>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {/* Completion bar */}
          <div className="mt-4 mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 font-bold">إنجاز التمارين</span>
              <span className="text-gray-700 ltr-num">{report.completedExercises}/{report.totalExercises}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${completion}%` }} />
            </div>
          </div>

          {/* Behavior ratings */}
          {report.behaviorRatings?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 mb-2">تقييمات السلوك (من 5)</p>
              <div className="space-y-2">
                {report.behaviorRatings.map(({ metric, score }) => (
                  <div key={metric} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-32 flex-shrink-0">{METRIC_LABELS[metric] || metric}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 ltr-num w-8 text-left">{score}/5</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {report.aiSummary && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-700">ملخص ذكي</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{report.aiSummary}</p>
            </div>
          )}

          {/* Professor notes */}
          {report.professorNotes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 mb-2">ملاحظات الأستاذ أمين</p>
              <p className="text-gray-700 text-sm leading-relaxed">{report.professorNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const [data, setData] = useState<ChildReports[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<string>('')

  useEffect(() => {
    fetch('/api/parent/reports')
      .then(r => r.json())
      .then(d => {
        setData(d.reportsPerChild || [])
        if (d.reportsPerChild?.[0]) setSelectedChild(d.reportsPerChild[0].child.id)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-brand-600 text-4xl animate-pulse">📋</div>
    </div>
  )

  const current = data.find(d => d.child.id === selectedChild)
  const reports = current?.reports || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-black text-2xl text-gray-900">التقارير</h1>
        <p className="text-gray-500 text-sm mt-0.5">تقارير التقدم الشهرية من الأستاذ أمين</p>
      </div>

      {/* Child selector */}
      {data.length > 1 && (
        <div className="flex gap-2">
          {data.map(({ child }) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                selectedChild === child.id ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {child.firstName}
            </button>
          ))}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-600 mb-2">لا توجد تقارير بعد</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            بعد انتهاء كل شهر من البرنامج، سيضع الأستاذ أمين تقريراً تفصيلياً عن تطور طفلك يظهر هنا.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <ReportCard key={report.id} report={report} child={current!.child} />
          ))}
        </div>
      )}

      <div className="bg-brand-50 rounded-2xl p-4 text-center">
        <p className="text-brand-700 text-sm leading-relaxed">
          <strong>كيف تُبنى التقارير؟</strong> بعد كل جلسة، يُسجّل الأستاذ أمين ملاحظاته. في نهاية كل شهر يُجمع تقرير شامل
          يقيس: الانتباه، الضبط الذاتي، المهارات الاجتماعية، وإنجاز التمارين — مع توصيات محددة للشهر القادم.
        </p>
      </div>
    </div>
  )
}
