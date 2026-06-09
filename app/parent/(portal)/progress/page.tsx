'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, Award, Zap, Target, Clock, Brain } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import type { Student, ProgressReport } from '@/lib/types'

interface GameHistory {
  totalPlays: number
  totalMinutes: number
  byGame: Record<string, { plays: number; avgScore: number; avgAccuracy: number; lastPlayed: string }>
  byWeek: { week: string; gamesPlayed: number; avgScore: number; totalMinutes: number }[]
}

interface ChildData {
  student: Student
  history: GameHistory
}

interface ChildReports { child: Student; reports: ProgressReport[] }

const DOMAIN_LABELS: Record<string, string> = {
  'memory-cards':    'مطابقة البطاقات',
  'sequence-memory': 'تذكر التسلسل',
  'n-back':          'ذاكرة N-Back',
  'word-recall':     'تذكر الكلمات',
  'letter-match':    'مطابقة الحروف',
  'breathing':       'تمارين التنفس',
  'tap-target':      'التناسق الحركي',
  'simon-says':      'سايمون يقول',
  'reaction-game':   'سرعة رد الفعل',
  'stroop-test':     'ستروب',
  'stop-signal':     'توقف أو اكمل',
  'emotion-cards':   'التعرف على المشاعر',
}

function weekLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

const METRIC_LABELS: Record<string, string> = {
  attention: 'الانتباه والتركيز',
  impulse_control: 'كبح الاندفاعية',
  social_interaction: 'المهارات الاجتماعية',
  motor_coordination: 'التنسيق الحركي',
  emotional_regulation: 'الضبط الانفعالي',
}

export default function ProgressPage() {
  const [gameData, setGameData] = useState<ChildData[]>([])
  const [reportData, setReportData] = useState<ChildReports[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'games' | 'reports'>('games')

  useEffect(() => {
    Promise.all([
      fetch('/api/parent/game-progress').then(r => r.json()).catch(() => ({ progressData: [] })),
      fetch('/api/parent/reports').then(r => r.json()).catch(() => ({ reportsPerChild: [] })),
    ]).then(([gameResp, reportResp]) => {
      const gd: ChildData[] = gameResp.progressData || []
      const rd: ChildReports[] = reportResp.reportsPerChild || []
      setGameData(gd)
      setReportData(rd)
      const firstId = gd[0]?.student.id || rd[0]?.child.id || ''
      setSelectedChild(firstId)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-brand-600 text-4xl animate-pulse">📈</div>
    </div>
  )

  const allChildren = Array.from(
    new Map([
      ...gameData.map(d => [d.student.id, d.student] as [string, Student]),
      ...reportData.map(d => [d.child.id, d.child] as [string, Student]),
    ]).entries()
  ).map(([, s]) => s)

  const currentGame = gameData.find(d => d.student.id === selectedChild)
  const currentReport = reportData.find(d => d.child.id === selectedChild)
  const student = allChildren.find(s => s.id === selectedChild)
  const reports = currentReport?.reports || []
  const latest = reports[0]
  const history = currentGame?.history

  // Top games by plays
  const topGames = history
    ? Object.entries(history.byGame)
        .map(([gameId, data]) => ({ gameId, ...data, label: DOMAIN_LABELS[gameId] || gameId }))
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 6)
    : []

  // Weekly chart data
  const weekChartData = history?.byWeek.map(w => ({
    name: weekLabel(w.week),
    ألعاب: w.gamesPlayed,
    'متوسط الأداء': w.avgScore,
    دقائق: w.totalMinutes,
  })) || []

  // Score progression from game chart
  const scoreChartData = history?.byWeek.map(w => ({
    name: weekLabel(w.week),
    'الأداء': w.avgScore,
  })) || []

  // Avg behavior scores from reports
  const avgScores: Record<string, { total: number; count: number }> = {}
  reports.forEach(r => {
    r.behaviorRatings?.forEach(({ metric, score }) => {
      if (!avgScores[metric]) avgScores[metric] = { total: 0, count: 0 }
      avgScores[metric].total += score
      avgScores[metric].count++
    })
  })

  const hasGameData = history && history.totalPlays > 0
  const hasReportData = reports.length > 0

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-black text-2xl text-gray-900">تطور طفلك</h1>
        <p className="text-gray-500 text-sm mt-0.5">بيانات حقيقية من الجلسات • محدّث تلقائياً</p>
      </div>

      {/* Child selector */}
      {allChildren.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allChildren.map(child => (
            <button key={child.id} onClick={() => setSelectedChild(child.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                selectedChild === child.id ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}>
              {child.firstName}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasGameData && !hasReportData && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-600 mb-2">لم تبدأ الجلسات بعد</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">بعد إجراء جلسات مع الأستاذ أمين، ستظهر هنا مؤشرات تطور طفلك بشكل تفصيلي.</p>
        </div>
      )}

      {(hasGameData || hasReportData) && (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-brand-50 rounded-2xl p-4 text-center">
              <Brain className="w-5 h-5 text-brand-600 mx-auto mb-1" />
              <div className="font-black text-xl text-brand-700 ltr-num">{history?.totalPlays ?? 0}</div>
              <div className="text-xs text-brand-600">لعبة مكتملة</div>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <div className="font-black text-xl text-amber-700 ltr-num">{history?.totalMinutes ?? 0}</div>
              <div className="text-xs text-amber-600">دقيقة تدريب</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4 text-center">
              <Zap className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <div className="font-black text-xl text-orange-700 ltr-num">{student?.streak ?? 0}</div>
              <div className="text-xs text-orange-600">يوم متتالي 🔥</div>
            </div>
            <div className="bg-purple-50 rounded-2xl p-4 text-center">
              <Award className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <div className="font-black text-xl text-purple-700 ltr-num">{student?.totalPoints ?? 0}</div>
              <div className="text-xs text-purple-600">نقطة إجمالية</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
            {([['games', '🎮 أداء الألعاب'], ['reports', '📊 تقارير الأستاذ']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === key ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Games tab */}
          {activeTab === 'games' && (
            <div className="space-y-5">
              {!hasGameData ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <Target className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">سيتم عرض بيانات الألعاب هنا بعد أول جلسة تفاعلية</p>
                </div>
              ) : (
                <>
                  {/* Weekly performance line chart */}
                  {scoreChartData.length > 1 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h2 className="font-black text-gray-900 mb-1 text-sm">منحنى الأداء الأسبوعي</h2>
                      <p className="text-gray-400 text-xs mb-4">متوسط الدرجة في كل أسبوع (0-100)</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={scoreChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            formatter={(v: number) => [`${v}%`, 'الأداء']}
                          />
                          <Line type="monotone" dataKey="الأداء" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Weekly activity bar chart */}
                  {weekChartData.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h2 className="font-black text-gray-900 mb-1 text-sm">النشاط الأسبوعي</h2>
                      <p className="text-gray-400 text-xs mb-4">عدد الألعاب ودقائق التدريب أسبوعياً</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={weekChartData} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="ألعاب" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="دقائق" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Top games */}
                  {topGames.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h2 className="font-black text-gray-900 mb-4 text-sm">أداء كل لعبة</h2>
                      <div className="space-y-3">
                        {topGames.map(game => (
                          <div key={game.gameId}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium">{game.label}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold ltr-num">×{game.plays}</span>
                              </div>
                              <span className="text-sm font-black text-gray-900 ltr-num">{game.avgScore}%</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  game.avgScore >= 80 ? 'bg-green-500' : game.avgScore >= 60 ? 'bg-amber-500' : 'bg-red-400'
                                }`}
                                style={{ width: `${game.avgScore}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Reports tab */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              {!hasReportData ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">سيتم عرض تقارير الأستاذ أمين هنا بعد كل دورة</p>
                </div>
              ) : (
                <>
                  {/* Avg behavior scores */}
                  {Object.keys(avgScores).length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h2 className="font-black text-gray-900 mb-4 text-sm">متوسط التقييم السلوكي</h2>
                      <div className="space-y-3.5">
                        {Object.entries(avgScores).map(([metric, { total, count }]) => {
                          const pct = Math.round(((total / count) / 5) * 100)
                          return (
                            <div key={metric}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-gray-700 font-medium">{METRIC_LABELS[metric] || metric}</span>
                                <span className="text-sm font-black text-gray-900 ltr-num">{pct}%</span>
                              </div>
                              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-brand-500 transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Points chart */}
                  {reports.length > 1 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h2 className="font-black text-gray-900 mb-4 text-sm">تطور النقاط</h2>
                      <div className="flex items-end gap-3 h-28">
                        {[...reports].reverse().slice(-6).map((r) => {
                          const pct = Math.min(100, (r.pointsEarned / 300) * 100)
                          return (
                            <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-xs text-gray-500 ltr-num">{r.pointsEarned}</span>
                              <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden flex-1 flex flex-col justify-end">
                                <div className="w-full bg-brand-500 rounded-t-lg" style={{ height: `${pct}%` }} />
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

                  {/* Latest report */}
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
                        <div className="bg-white/10 rounded-xl p-3 mb-3">
                          <p className="text-white/70 text-xs mb-1 font-bold">ملاحظات الأستاذ أمين</p>
                          <p className="text-white text-sm leading-relaxed">{latest.professorNotes}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-white/70 text-xs">
                        <span>✅ {latest.completedExercises}/{latest.totalExercises} تمرين</span>
                        <span>⭐ {latest.pointsEarned} نقطة</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
