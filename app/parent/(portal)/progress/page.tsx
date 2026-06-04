'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, Award, Zap } from 'lucide-react'
import type { Student, ProgressReport } from '@/lib/types'

interface ChildReports { child: Student; reports: ProgressReport[] }

function ScoreBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-700 font-medium">{label}</span>
        <span className="text-sm font-black text-gray-900 ltr-num">{pct}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const RATING_COLORS: Record<string, string> = {
  'الانتباه':         'bg-brand-500',
  'السلوك':           'bg-emerald-500',
  'المهارات الاجتماعية': 'bg-purple-500',
  'الضبط الذاتي':    'bg-amber-500',
  'attention':        'bg-brand-500',
  'behavior':         'bg-emerald-500',
  'social':           'bg-purple-500',
  'selfControl':      'bg-amber-500',
}

export default function ProgressPage() {
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
      <div className="text-brand-600 text-4xl animate-pulse">📈</div>
    </div>
  )

  const current = data.find(d => d.child.id === selectedChild)
  const reports = current?.reports || []
  const latest = reports[0]

  const METRIC_LABELS: Record<string, string> = {
    attention: 'الانتباه والتركيز',
    impulse_control: 'كبح الاندفاعية',
    social_interaction: 'المهارات الاجتماعية',
    motor_coordination: 'التنسيق الحركي',
    emotional_regulation: 'الضبط الانفعالي',
  }
  // Aggregate average scores across all reports
  const avgScores: Record<string, { total: number; count: number }> = {}
  reports.forEach(r => {
    r.behaviorRatings?.forEach(({ metric, score }) => {
      if (!avgScores[metric]) avgScores[metric] = { total: 0, count: 0 }
      avgScores[metric].total += score
      avgScores[metric].count++
    })
  })

  const totalPoints = current?.child.totalPoints || 0
  const streak = current?.child.streak || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-black text-2xl text-gray-900">تقدم طفلك</h1>
        <p className="text-gray-500 text-sm mt-0.5">تطور مُقاس بمعايير علمية موضوعية</p>
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

      {data.length === 0 || !current ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-600 mb-2">لم تبدأ الجلسات بعد</h3>
          <p className="text-gray-400 text-sm">بعد إجراء جلسات والحصول على تقارير التقدم، ستظهر هنا الرسوم البيانية لتطور طفلك.</p>
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-brand-50 rounded-2xl p-4 text-center">
              <Award className="w-5 h-5 text-brand-600 mx-auto mb-1" />
              <div className="font-black text-xl text-brand-700 ltr-num">{totalPoints}</div>
              <div className="text-xs text-brand-600">نقطة إجمالية</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4 text-center">
              <Zap className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <div className="font-black text-xl text-orange-700 ltr-num">{streak}</div>
              <div className="text-xs text-orange-600">يوم متتالي 🔥</div>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="font-black text-xl text-emerald-700 ltr-num">{reports.length}</div>
              <div className="text-xs text-emerald-600">تقرير مكتمل</div>
            </div>
          </div>

          {/* Average scores */}
          {Object.keys(avgScores).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-black text-gray-900 mb-4">متوسط الأداء — كل التقارير</h2>
              <div className="space-y-4">
                {Object.entries(avgScores).map(([metric, { total, count }]) => (
                  <ScoreBar
                    key={metric}
                    label={METRIC_LABELS[metric] || metric}
                    score={total / count}
                    max={5}
                    color={RATING_COLORS[metric] || 'bg-brand-400'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Monthly chart (CSS bar chart) */}
          {reports.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-black text-gray-900 mb-4">تطور النقاط عبر الزمن</h2>
              <div className="flex items-end gap-3 h-32">
                {[...reports].reverse().slice(-6).map((r, i) => {
                  const pct = Math.min(100, (r.pointsEarned / 300) * 100)
                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500 ltr-num">{r.pointsEarned}</span>
                      <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden flex-1 flex flex-col justify-end">
                        <div
                          className="w-full bg-brand-500 rounded-t-lg transition-all duration-700"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 ltr-num">
                        {new Date(r.periodEnd).toLocaleDateString('ar', { month: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Latest report highlight */}
          {latest && (
            <div className="bg-gradient-to-l from-brand-600 to-brand-800 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-lg">آخر تقرير</h2>
                <span className="text-white/70 text-xs">
                  {new Date(latest.periodEnd).toLocaleDateString('ar-SA')}
                </span>
              </div>
              {latest.aiSummary && (
                <p className="text-white/90 text-sm leading-relaxed mb-4">{latest.aiSummary}</p>
              )}
              {latest.professorNotes && (
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/70 text-xs mb-1 font-bold">ملاحظات الأستاذ أمين</p>
                  <p className="text-white text-sm leading-relaxed">{latest.professorNotes}</p>
                </div>
              )}
              <div className="flex items-center gap-4 mt-4 text-white/70 text-xs">
                <span>✅ {latest.completedExercises}/{latest.totalExercises} تمرين</span>
                <span>⭐ {latest.pointsEarned} نقطة</span>
              </div>
            </div>
          )}

          {/* Exercise completion */}
          {latest && latest.totalExercises > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-black text-gray-900 mb-3 text-sm">معدل إنجاز التمارين</h2>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((latest.completedExercises / latest.totalExercises) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span className="ltr-num">{latest.completedExercises} من {latest.totalExercises}</span>
                <span className="font-bold text-emerald-600 ltr-num">
                  {Math.round((latest.completedExercises / latest.totalExercises) * 100)}%
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
