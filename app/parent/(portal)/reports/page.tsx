'use client'
import { useEffect, useState } from 'react'
import { FileText, ChevronDown, ChevronUp, Brain } from 'lucide-react'
import type { Student, ProgressReport } from '@/lib/types'

interface ChildReports { child: Student; reports: ProgressReport[] }

const REPORT_TYPE_LABELS: Record<string, string> = {
  weekly:  'تقرير أسبوعي',
  monthly: 'تقرير شهري',
  session: 'تقرير جلسة',
}

const METRIC_LABELS: Record<string, string> = {
  attention:            'الانتباه والتركيز',
  impulse_control:      'كبح الاندفاعية',
  social_interaction:   'المهارات الاجتماعية',
  motor_coordination:   'التنسيق الحركي',
  emotional_regulation: 'الضبط الانفعالي',
}

function ReportCard({ report, child }: { report: ProgressReport; child: Student }) {
  const [open, setOpen] = useState(false)
  const completion = report.totalExercises > 0
    ? Math.round((report.completedExercises / report.totalExercises) * 100)
    : 0

  void child

  const completionStyle = completion >= 80
    ? { background: '#ECFDF5', color: '#065F46' }
    : completion >= 50
    ? { background: '#FFFBEB', color: '#B45309' }
    : { background: '#FEF2F2', color: '#B91C1C' }

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1.5px solid #F0E8FF', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-right transition-all"
        style={{ background: 'transparent' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFF8F0' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#F3EEFF' }}
          >
            <FileText className="w-5 h-5" style={{ color: '#6B46F0' }} />
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
            <div className="font-black ltr-num" style={{ color: '#5A32D9' }}>{report.pointsEarned}</div>
            <div className="text-gray-400 text-xs">نقطة</div>
          </div>
          <span
            className="text-xs font-black px-3 py-1.5 rounded-full ltr-num"
            style={completionStyle}
          >
            {completion}%
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5" style={{ borderTop: '1.5px solid #F0E8FF', background: '#FFF8F0' }}>
          {/* Completion bar */}
          <div className="mt-4 mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 font-bold">إنجاز التمارين</span>
              <span className="text-gray-700 ltr-num">{report.completedExercises}/{report.totalExercises}</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${completion}%`, background: '#7C5CFC' }}
              />
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
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(score / 5) * 100}%`, background: '#9A7BFD' }} />
                    </div>
                    <span className="text-xs text-gray-500 ltr-num w-8 text-left">{score}/5</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {report.aiSummary && (
            <div className="rounded-2xl p-4 mb-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4" style={{ color: '#D97706' }} />
                <span className="text-xs font-bold" style={{ color: '#B45309' }}>ملخص ذكي</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{report.aiSummary}</p>
            </div>
          )}

          {/* Professor notes */}
          {report.professorNotes && (
            <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #F0E8FF' }}>
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
    <div className="flex items-center justify-center py-20" dir="rtl">
      <div className="text-4xl animate-pulse">📋</div>
    </div>
  )

  const current = data.find(d => d.child.id === selectedChild)
  const reports = current?.reports || []

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: '#F3EEFF', boxShadow: '0 2px 8px -2px rgba(124,92,252,0.15)' }}
        >
          📄
        </div>
        <div>
          <h1 className="font-black text-xl text-gray-900">التقارير</h1>
          <p className="text-gray-400 text-sm">تقارير التقدم الشهرية من الأستاذ أمين</p>
        </div>
      </div>

      {/* ── Child selector ── */}
      {data.length > 1 && (
        <div className="flex gap-2">
          {data.map(({ child }) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={
                selectedChild === child.id
                  ? { background: '#6B46F0', color: '#FFFFFF' }
                  : { background: '#FFFFFF', color: '#6B7280', border: '1.5px solid #F0E8FF' }
              }
              onMouseEnter={e => { if (selectedChild !== child.id) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D3BBFF'; (e.currentTarget as HTMLButtonElement).style.color = '#6B46F0' } }}
              onMouseLeave={e => { if (selectedChild !== child.id) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F0E8FF'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' } }}
            >
              {child.firstName}
            </button>
          ))}
        </div>
      )}

      {reports.length === 0 ? (
        <div
          className="rounded-3xl p-14 text-center"
          style={{ background: '#FFFFFF', border: '2px dashed #E8DBFF' }}
        >
          <div className="text-6xl mb-4">📋</div>
          <h3 className="font-black text-gray-700 text-lg mb-2">لا توجد تقارير بعد</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">سيُرسل الأستاذ أمين تقارير دورية بعد كل دورة جلسات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <ReportCard key={report.id} report={report} child={current!.child} />
          ))}
        </div>
      )}

      <div
        className="rounded-3xl p-4 text-center"
        style={{ background: '#F3EEFF', border: '1.5px solid #E8DBFF' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: '#5A32D9' }}>
          <strong>كيف تُبنى التقارير؟</strong> بعد كل جلسة، يُسجّل الأستاذ أمين ملاحظاته. في نهاية كل شهر يُجمع تقرير شامل
          يقيس: الانتباه، الضبط الذاتي، المهارات الاجتماعية، وإنجاز التمارين — مع توصيات محددة للشهر القادم.
        </p>
      </div>
    </div>
  )
}
